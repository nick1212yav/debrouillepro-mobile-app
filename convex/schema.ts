import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─────────────────────────────────────────────────────────────────────────
  // CORE
  // ─────────────────────────────────────────────────────────────────────────
  users: defineTable({
    uid: v.string(), // ✅ Firebase UID
    tokenIdentifier: v.string(), // ✅ Convex token
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    name: v.string(),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    roles: v.array(v.string()), // ✅ multi-rôles
    permissions: v.optional(v.array(v.string())), // ✅ permissions
    emailVerified: v.boolean(),
    onboardingCompleted: v.boolean(),
    reputationScore: v.number(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    language: v.optional(v.string()),
    profession: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    location: v.optional(
      v.object({
        city: v.optional(v.string()),
        country: v.optional(v.string()),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
        area: v.optional(v.string()),
      }),
    ),
    homePreferences: v.optional(
      v.object({
        favoriteModules: v.array(v.string()),
        hiddenSections: v.array(v.string()),
        customSectionOrder: v.array(v.string()),
        notificationPreferences: v.object({
          newRecommendations: v.boolean(),
          nearbyAlerts: v.boolean(),
          opportunities: v.boolean(),
        }),
      }),
    ),
    isAdmin: v.optional(v.boolean()), // ⚠️ déprécié (utiliser permissions)
    isBanned: v.optional(v.boolean()),
    website: v.optional(v.string()),
  })
    .index("by_uid", ["uid"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  contentFlags: defineTable({
    // Target: either a publication or a comment (one must be set)
    publicationId: v.optional(v.id("publications")),
    commentId: v.optional(v.id("comments")),
    contentType: v.union(v.literal("publication"), v.literal("comment")),
    reportedBy: v.id("users"),
    reason: v.union(
      v.literal("spam"),
      v.literal("inappropriate"),
      v.literal("fake"),
      v.literal("harassment"),
      v.literal("other"),
    ),
    note: v.optional(v.string()),
    resolved: v.boolean(),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.string()),
  })
    .index("by_publication", ["publicationId"])
    .index("by_comment", ["commentId"])
    .index("by_resolved", ["resolved"])
    .index("by_contentType_resolved", ["contentType", "resolved"]),

  moderationReports: defineTable({
    messageId: v.id("messages"),
    reportedBy: v.id("users"),

    reason: v.union(
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("inappropriate"),
      v.literal("threat"),
      v.literal("scam"),
      v.literal("other"),
    ),

    description: v.optional(v.string()),

    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("rejected"),
    ),

    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),

    createdAt: v.number(),
  })
    .index("by_reporter", ["reportedBy"])
    .index("by_message", ["messageId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  publicationBoosts: defineTable({
    publicationId: v.id("publications"),
    userId: v.id("users"),
    tier: v.union(v.literal("basic"), v.literal("pro"), v.literal("elite")),
    startsAt: v.string(),
    expiresAt: v.string(),
    active: v.boolean(),
  })
    .index("by_publication", ["publicationId"])
    .index("by_user", ["userId"])
    .index("by_active", ["active"]),

  conversations: defineTable({
    participantIds: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupAvatar: v.optional(v.string()),
    lastMessageText: v.optional(v.string()),
    lastMessageSenderId: v.optional(v.id("users")),
    updatedAt: v.string(),
  }).index("by_updatedAt", ["updatedAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),

    // Contenu
    text: v.string(),

    // Type de message
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("voice"),
      v.literal("file"),
      v.literal("location"),
      v.literal("contact"),
      v.literal("publication"),
      v.literal("system"),
    ),

    // État de livraison
    status: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed"),
    ),

    // Réactions
    reactions: v.array(
      v.object({
        emoji: v.string(),
        count: v.number(),
      }),
    ),

    // Réponse / partage
    replyToId: v.optional(v.id("messages")),
    sharedPublicationId: v.optional(v.id("publications")),

    // Édition
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),

    // Suppression
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),

    // Épinglage
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()),
    pinnedBy: v.optional(v.id("users")),

    // Message vocal
    voiceFileId: v.optional(v.id("_storage")),
    voiceDuration: v.optional(v.number()),

    // Fichier / média
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileMimeType: v.optional(v.string()),
    fileSize: v.optional(v.number()),

    // Média
    mediaUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),

    // Métadonnées
    metadata: v.optional(v.any()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"])
    .index("by_conversation_and_sender", ["conversationId", "senderId"])
    .index("by_status", ["status"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    updatedAt: v.string(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user_and_conversation", ["userId", "conversationId"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
    lastActiveAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_user", ["conversationId", "userId"])
    .index("by_user", ["userId"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    keys: v.object({ p256dh: v.string(), auth: v.string() }),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  pushIdentities: defineTable({
    secret: v.string(),
    visitorId: v.string(),
  })
    .index("by_secret", ["secret"])
    .index("by_visitorId", ["visitorId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("message"),
      v.literal("job"),
      v.literal("immo"),
      v.literal("payment"),
      v.literal("system"),
      v.literal("delivery"),
      v.literal("sante"),
      v.literal("agri"),
      v.literal("transport"),
      v.literal("community"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("boost"),
      v.literal("event"),
      v.literal("streak"),
      v.literal("digest"),
      v.literal("annonce"),
    ),
    fromUserId: v.optional(v.id("users")),
    fromUserName: v.optional(v.string()),
    fromUserAvatar: v.optional(v.string()),
    publicationId: v.optional(v.id("publications")),
    module: v.string(),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    pinned: v.boolean(),
    priority: v.union(v.literal("high"), v.literal("normal"), v.literal("low")),
    initials: v.optional(v.string()),
    actionPage: v.optional(v.string()),
    amount: v.optional(v.string()),
    actionButtons: v.optional(
      v.array(
        v.object({
          label: v.string(),
          variant: v.union(v.literal("primary"), v.literal("danger")),
        }),
      ),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"]),

  publications: defineTable({
    authorId: v.id("users"),
    type: v.union(
      v.literal("immo"),
      v.literal("job"),
      v.literal("service"),
      v.literal("evenement"),
      v.literal("community"),
      v.literal("agri"),
      v.literal("sante"),
      v.literal("transport"),
      v.literal("annonce"),
      v.literal("restauration"),
      v.literal("hebergement"),
      v.literal("energie"),
      v.literal("ong"),
      v.literal("video"),
      v.literal("article"),
      v.literal("sondage"),
      v.literal("marketplace"),
      v.literal("network"),
      v.literal("voyages"),
    ),
    title: v.string(),
    description: v.string(),
    price: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    images: v.array(v.string()),
    tags: v.array(v.string()),
    likeCount: v.number(),
    viewCount: v.number(),
    commentCount: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("closed"),
    ),
    meta: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    // Moderation
    flagCount: v.optional(v.number()),
    isHidden: v.optional(v.boolean()),
    shareCount: v.optional(v.number()),
    offerCount: v.optional(v.number()),
    isPromoted: v.optional(v.boolean()),
    isPremium: v.optional(v.boolean()),
    promotionEnd: v.optional(v.number()),
    isReserved: v.optional(v.boolean()),
    isSold: v.optional(v.boolean()),
    warrantyMonths: v.optional(v.number()),
    deliveryAvailable: v.optional(v.boolean()),
    deliveryPrice: v.optional(v.number()),
    paymentMethods: v.optional(v.array(v.string())),
    negotiable: v.optional(v.boolean()),
    minPrice: v.optional(v.number()),
    avgRating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
  })
    .index("by_author", ["authorId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .searchIndex("search_publications", {
      searchField: "title",
      filterFields: ["type", "status"],
    }),
  // ── FAVORIS DES PUBLICATIONS ──
  publicationFavorites: defineTable({
    userId: v.id("users"),
    publicationId: v.id("publications"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_publication", ["publicationId"])
    .index("by_user_and_publication", ["userId", "publicationId"]),

  // ── OFFRES SUR LES PUBLICATIONS ──
  publicationOffers: defineTable({
    publicationId: v.id("publications"),
    buyerId: v.id("users"),
    amount: v.number(),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("countered"),
    ),
    counterAmount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_publication", ["publicationId"])
    .index("by_buyer", ["buyerId"])
    .index("by_status", ["status"]),

  // ── AVIS SUR LES PUBLICATIONS ──
  publicationReviews: defineTable({
    publicationId: v.id("publications"),
    reviewerId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
  })
    .index("by_publication", ["publicationId"])
    .index("by_reviewer", ["reviewerId"]),

  // ── PARTAGES DES PUBLICATIONS ──
  publicationShares: defineTable({
    publicationId: v.id("publications"),
    userId: v.id("users"),
    sharedAt: v.number(),
    platform: v.optional(v.string()),
  })
    .index("by_publication", ["publicationId"])
    .index("by_user", ["userId"]),
  // ── QUESTIONS SUR LES PUBLICATIONS ──
  publicationQuestions: defineTable({
    publicationId: v.id("publications"),
    askerId: v.id("users"),
    question: v.string(),
    answer: v.optional(v.string()),
    answererId: v.optional(v.id("users")),
    answeredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_publication", ["publicationId"])
    .index("by_asker", ["askerId"]),

  publicationLikes: defineTable({
    publicationId: v.id("publications"),
    userId: v.id("users"),
  })
    .index("by_publication", ["publicationId"])
    .index("by_user_and_publication", ["userId", "publicationId"]),

  // ============================================================
  // HOME — ANALYTICS / INTERACTIONS
  // ============================================================

  homeEvents: defineTable({
    userId: v.optional(v.id("users")),

    eventType: v.union(
      v.literal("section_impression"),
      v.literal("item_impression"),
      v.literal("click"),
      v.literal("like"),
      v.literal("save"),
      v.literal("share"),
      v.literal("comment"),
      v.literal("scroll"),
      v.literal("time_spent"),
      v.literal("search"),
      v.literal("dismiss"),
      v.literal("refresh"),
    ),

    sessionId: v.optional(v.string()),
    sectionId: v.optional(v.string()),
    itemId: v.optional(v.string()),
    itemType: v.optional(v.string()),
    moduleId: v.optional(v.string()),
    position: v.optional(v.number()),
    source: v.optional(v.string()),

    metadata: v.optional(v.record(v.string(), v.any())),

    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"])
    .index("by_event_type", ["eventType"])
    .index("by_item", ["itemId"])
    .index("by_module", ["moduleId"]),

  interactions: defineTable({
    userId: v.id("users"),
    publicationId: v.id("publications"),
    type: v.union(
      v.literal("view"),
      v.literal("like"),
      v.literal("save"),
      v.literal("share"),
      v.literal("comment"),
      v.literal("click"),
    ),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_publication", ["publicationId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_and_following", ["followerId", "followingId"]),

  comments: defineTable({
    publicationId: v.id("publications"),
    authorId: v.id("users"),
    text: v.string(),
    parentId: v.optional(v.id("comments")),
    likeCount: v.optional(v.number()), // ✅ Optionnel – tolère les anciens documents
  })
    .index("by_publication", ["publicationId"])
    .index("by_author", ["authorId"]),
  commentLikes: defineTable({
    userId: v.id("users"),
    commentId: v.id("comments"),
  })
    .index("by_user_and_comment", ["userId", "commentId"])
    .index("by_comment", ["commentId"]),

  bookmarks: defineTable({
    publicationId: v.id("publications"),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_publication", ["userId", "publicationId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    theme: v.union(v.literal("dark"), v.literal("light"), v.literal("system")),
    language: v.union(v.literal("fr"), v.literal("en"), v.literal("ar")),
    notifMessages: v.boolean(),
    notifPublications: v.boolean(),
    notifSystem: v.boolean(),
    notifSounds: v.boolean(),
    feedCategories: v.array(v.string()),
    favoriteModules: v.array(v.string()),
    profilePublic: v.boolean(),
    showEmail: v.boolean(),
    shareActivity: v.optional(v.boolean()),
    analyticsConsent: v.optional(v.boolean()),
    locationServices: v.optional(v.boolean()),
    thirdPartyAds: v.optional(v.boolean()),
    reducedMotion: v.boolean(),
    compactMode: v.boolean(),
    // Appearance prefs (synced from use-appearance hook)
    accentColor: v.optional(
      v.union(
        v.literal("violet"),
        v.literal("bleu"),
        v.literal("vert"),
        v.literal("orange"),
        v.literal("rose"),
        v.literal("dore"),
      ),
    ),
    textSize: v.optional(
      v.union(v.literal("petit"), v.literal("normal"), v.literal("grand")),
    ),
    density: v.optional(
      v.union(v.literal("compact"), v.literal("confortable")),
    ),
    colorBlindMode: v.optional(
      v.union(
        v.literal("none"),
        v.literal("deuteranopia"),
        v.literal("protanopia"),
        v.literal("tritanopia"),
        v.literal("achromatopsia"),
      ),
    ),
    highContrast: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  privacyRequests: defineTable({
    userId: v.id("users"),

    type: v.union(v.literal("export"), v.literal("deletion")),

    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("rejected"),
    ),

    createdAt: v.number(),
    processedAt: v.optional(v.number()),

    note: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_user_and_type", ["userId", "type"]),

  userActivity: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("view_module"),
      v.literal("view_publication"),
      v.literal("search"),
      v.literal("create_publication"),
    ),
    label: v.string(),
    target: v.optional(v.string()),
    meta: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.string(),
    unlockedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_badge", ["userId", "badgeId"]),

  xpLog: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    sourceType: v.union(
      v.literal("publication"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("module_visit"),
      v.literal("badge"),
      v.literal("onboarding"),
      v.literal("daily_streak"),
    ),
    sourceId: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  userStreaks: defineTable({
    userId: v.id("users"),
    currentStreak: v.number(), // consecutive days
    longestStreak: v.number(),
    lastClaimedDate: v.string(), // ISO date "YYYY-MM-DD" UTC
    totalDaysClaimed: v.number(),
  }).index("by_user", ["userId"]),

  events: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("culturel"),
      v.literal("sportif"),
      v.literal("religieux"),
      v.literal("professionnel"),
      v.literal("communautaire"),
      v.literal("formation"),
      v.literal("festival"),
      v.literal("autre"),
    ),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    location: v.string(),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
    isFree: v.boolean(),
    price: v.optional(v.string()),
    tags: v.array(v.string()),
    status: v.union(
      v.literal("upcoming"),
      v.literal("ongoing"),
      v.literal("past"),
      v.literal("cancelled"),
    ),
    // ═══ AJOUTS ═══
    viewCount: v.optional(v.number()),
    commentCount: v.optional(v.number()),
    shareCount: v.optional(v.number()),
    gallery: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_startDate", ["startDate"]),

  eventRsvps: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("attending"),
      v.literal("interested"),
      v.literal("not_going"),
    ),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_and_user", ["eventId", "userId"]),

  // ── NOUVELLES TABLES POUR ÉVÉNEMENTS ──
  eventLikes: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
  })
    .index("by_event", ["eventId"])
    .index("by_user_and_event", ["userId", "eventId"]),

  eventBookmarks: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
  })
    .index("by_event", ["eventId"])
    .index("by_user_and_event", ["userId", "eventId"]),

  eventComments: defineTable({
    eventId: v.id("events"),
    authorId: v.id("users"),
    text: v.string(),
    parentId: v.optional(v.id("eventComments")),
    likeCount: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_author", ["authorId"]),

  eventCommentLikes: defineTable({
    commentId: v.id("eventComments"),
    userId: v.id("users"),
  })
    .index("by_comment", ["commentId"])
    .index("by_user_and_comment", ["userId", "commentId"]),

  eventTickets: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    ticketNumber: v.string(),
    qrCode: v.string(),
    status: v.union(
      v.literal("valid"),
      v.literal("used"),
      v.literal("cancelled"),
    ),
    purchasedAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_user_and_event", ["userId", "eventId"]),

  profileViews: defineTable({
    profileId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    date: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_and_date", ["profileId", "date"]),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),

    unreadCount: v.number(),

    role: v.optional(
      v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    ),

    isMuted: v.optional(v.boolean()),
    joinedAt: v.optional(v.number()),
    lastReadAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_user_and_conversation", ["userId", "conversationId"])
    .index("by_conversation_and_user", ["conversationId", "userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // COMMERCE / MARKETPLACE
  // ─────────────────────────────────────────────────────────────────────────
  products: defineTable({
    sellerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    price: v.number(), // in XAF/CFA
    currency: v.string(), // "XAF", "EUR", "USD"
    category: v.string(),
    images: v.array(v.string()),
    stock: v.number(),
    unit: v.optional(v.string()), // "kg", "pièce", "lot"…
    tags: v.array(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("out_of_stock"),
      v.literal("archived"),
    ),
    isDigital: v.boolean(),
    deliveryAvailable: v.boolean(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    location: v.optional(v.string()),
  })
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .searchIndex("search_products", {
      searchField: "title",
      filterFields: ["category", "status"],
    }),

  orders: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    totalAmount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded"),
    ),
    deliveryAddress: v.optional(v.string()),
    note: v.optional(v.string()),
    paidAt: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
    publicationId: v.optional(v.id("publications")),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_product", ["productId"])
    .index("by_status", ["status"]),

  productReviews: defineTable({
    productId: v.id("products"),
    orderId: v.id("orders"),
    reviewerId: v.id("users"),
    rating: v.number(), // 1–5
    comment: v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_reviewer", ["reviewerId"]),

  // dans convex/schema.ts (ajouter ces tables)

  escrowTransactions: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    orderId: v.optional(v.id("orders")),
    productId: v.optional(v.id("products")),
    amount: v.number(),
    currency: v.string(),
    method: v.union(
      v.literal("mobile_money"),
      v.literal("card"),
      v.literal("bank_transfer"),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("released"),
      v.literal("disputed"),
      v.literal("cancelled"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    confirmedAt: v.optional(v.number()),
    releasedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    disputedAt: v.optional(v.number()),
    disputeReason: v.optional(v.string()),
  })
    .index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_order", ["orderId"])
    .index("by_status", ["status"]),

  refundRequests: defineTable({
    orderId: v.id("orders"),
    requesterId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    reason: v.string(),
    comment: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.id("users")),
    rejectedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_requester", ["requesterId"])
    .index("by_status", ["status"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),
  // Likes sur les avis
  reviewLikes: defineTable({
    userId: v.id("users"),
    reviewId: v.id("productReviews"),
  })
    .index("by_user", ["userId"])
    .index("by_review", ["reviewId"])
    .index("by_user_and_review", ["userId", "reviewId"]),

  // Liste de souhaits (wishlist)
  wishlistItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_user_and_product", ["userId", "productId"]),

  // Abonnements aux vendeurs
  sellerFollowers: defineTable({
    userId: v.id("users"),
    sellerId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_seller", ["sellerId"])
    .index("by_user_and_seller", ["userId", "sellerId"]),

  // Questions sur les produits
  productQuestions: defineTable({
    productId: v.id("products"),
    authorId: v.id("users"),
    question: v.string(),
    answer: v.optional(v.string()),
    answeredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_author", ["authorId"]),

  // Historique de consultation
  recentlyViewed: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    viewedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_user_and_product", ["userId", "productId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // IMMOBILIER & LOGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  properties: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("appartement"),
      v.literal("maison"),
      v.literal("villa"),
      v.literal("studio"),
      v.literal("bureau"),
      v.literal("terrain"),
      v.literal("chambre"),
      v.literal("entrepot"),
    ),
    transactionType: v.union(v.literal("location"), v.literal("vente")),
    price: v.number(),
    currency: v.string(),
    surface: v.optional(v.number()), // m²
    rooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    images: v.array(v.string()),
    videos: v.optional(v.array(v.string())),
    city: v.string(),
    neighborhood: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    amenities: v.array(v.string()), // "wifi", "parking", "garden"…
    phone: v.optional(v.string()),
    virtualTourUrl: v.optional(v.string()),
    floorPlanUrl: v.optional(v.string()),
    tour360Images: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("available"),
      v.literal("rented"),
      v.literal("sold"),
      v.literal("archived"),
    ),
    featured: v.boolean(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .searchIndex("search_properties", {
      searchField: "title",
      filterFields: ["type", "status"],
    }),
  // ── Médias des biens (photos, vidéos, 360°, etc.) ──
  propertyMedia: defineTable({
    propertyId: v.id("properties"),
    type: v.union(
      v.literal("photo"),
      v.literal("video"),
      v.literal("drone"),
      v.literal("360"),
      v.literal("plan"),
      v.literal("pdf"),
    ),
    url: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    size: v.optional(v.number()),
    order: v.number(),
    isCover: v.boolean(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  })
    .index("by_property", ["propertyId"])
    .index("by_order", ["propertyId", "order"]),

  // ── Favoris des biens ──
  propertyFavorites: defineTable({
    propertyId: v.id("properties"),
    userId: v.id("users"),
  })
    .index("by_user_and_property", ["userId", "propertyId"])
    .index("by_property", ["propertyId"]),

  // ── Vues des biens (analytics) ──
  propertyViews: defineTable({
    propertyId: v.id("properties"),
    userId: v.optional(v.id("users")),
    viewedAt: v.number(),
  }).index("by_property", ["propertyId"]),

  propertyRequests: defineTable({
    userId: v.id("users"),
    propertyId: v.id("properties"),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    visitDate: v.optional(v.string()),
  })
    .index("by_property", ["propertyId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Logement social / demandes HLM
  socialHousingRequests: defineTable({
    userId: v.id("users"),
    householdSize: v.number(),
    monthlyIncome: v.optional(v.number()),
    currentSituation: v.string(),
    preferredCity: v.string(),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    submittedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Hébergements (hôtels, villas…)

  accommodations: defineTable({
    hostId: v.id("users"),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("hotel"),
      v.literal("villa"),
      v.literal("auberge"),
      v.literal("appartement"),
      v.literal("chambre_hote"),
      v.literal("camping"),
    ),
    // ✅ Remplacer pricePerNight par price (pour correspondre à votre code Convex)
    price: v.number(), // Prix unitaire
    currency: v.string(),
    images: v.array(v.string()),
    city: v.string(),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    amenities: v.array(v.string()),
    maxGuests: v.number(),
    rating: v.optional(v.number()),
    reviewCount: v.number(),
    // ✅ Ajout du champ disponible (booléen)
    available: v.boolean(),
    // ✅ Ajout du champ createdAt (timestamp)
    createdAt: v.number(),
    // On conserve status pour les éventuels besoins de modération/archivage
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  })
    .index("by_host", ["hostId"])
    .index("by_city", ["city"])
    .searchIndex("search_accommodations", {
      searchField: "title",
      filterFields: ["city", "available"], // on peut filtrer par disponibilité
    }),

  accommodationBookings: defineTable({
    accommodationId: v.id("accommodations"),
    userId: v.id("users"),
    checkIn: v.string(), // ISO 8601 date
    checkOut: v.string(),
    guests: v.number(),
    totalAmount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
    ),
    message: v.optional(v.string()),
  })
    .index("by_accommodation", ["accommodationId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ─────────────────────────────────────────────────────────────────────────────
  // HÉBERGEMENT – TABLES SUPPLÉMENTAIRES
  // ─────────────────────────────────────────────────────────────────────────────

  accommodationFavorites: defineTable({
    userId: v.id("users"),
    accommodationId: v.id("accommodations"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_accommodation", ["accommodationId"])
    .index("by_user_and_accommodation", ["userId", "accommodationId"]),

  accommodationAvailability: defineTable({
    accommodationId: v.id("accommodations"),
    startDate: v.string(), // ISO 8601 date
    endDate: v.string(), // ISO 8601 date
    isAvailable: v.boolean(), // true = disponible, false = bloqué/réservé
    reason: v.optional(v.string()), // "reserved", "maintenance", "owner_blocked"
    bookingId: v.optional(v.id("accommodationBookings")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_accommodation", ["accommodationId"])
    .index("by_dates", ["accommodationId", "startDate", "endDate"])
    .index("by_isAvailable", ["isAvailable"]),

  accommodationImages: defineTable({
    accommodationId: v.id("accommodations"),
    url: v.string(),
    isCover: v.boolean(),
    order: v.number(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_accommodation", ["accommodationId"])
    .index("by_order", ["accommodationId", "order"]),

  // ─────────────────────────────────────────────────────────────────────────
  // EMPLOI & BUSINESS
  // ─────────────────────────────────────────────────────────────────────────
  jobListings: defineTable({
    employerId: v.id("users"),
    title: v.string(),
    description: v.string(),
    company: v.string(),
    companyLogo: v.optional(v.string()),
    category: v.string(),
    contractType: v.union(
      v.literal("cdi"),
      v.literal("cdd"),
      v.literal("stage"),
      v.literal("freelance"),
      v.literal("alternance"),
      v.literal("benevole"),
    ),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    currency: v.optional(v.string()),
    city: v.string(),
    remote: v.boolean(),
    skills: v.array(v.string()),
    deadline: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("filled"),
    ),
  })
    .index("by_employer", ["employerId"])
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .searchIndex("search_jobs", {
      searchField: "title",
      filterFields: ["category", "status"],
    }),

  jobApplications: defineTable({
    jobId: v.id("jobListings"),
    applicantId: v.id("users"),
    coverLetter: v.optional(v.string()),
    cvUrl: v.optional(v.string()),
    status: v.union(
      v.literal("submitted"),
      v.literal("viewed"),
      v.literal("shortlisted"),
      v.literal("rejected"),
      v.literal("hired"),
    ),
    appliedAt: v.string(),
  })
    .index("by_job", ["jobId"])
    .index("by_applicant", ["applicantId"])
    .index("by_job_and_applicant", ["jobId", "applicantId"])
    .index("by_status", ["status"]),

  // Profils entreprise / business
  businessProfiles: defineTable({
    userId: v.id("users"),
    companyName: v.string(),
    sector: v.string(),
    description: v.string(),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    city: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    employeeCount: v.optional(v.string()), // "1-10", "11-50"…
    foundedYear: v.optional(v.number()),
    verified: v.boolean(),
    rating: v.optional(v.number()),
    reviewCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_sector", ["sector"])
    .searchIndex("search_businesses", {
      searchField: "companyName",
      filterFields: ["sector"],
    }),

  // Missions freelance
  freelanceMissions: defineTable({
    clientId: v.id("users"),
    title: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    duration: v.optional(v.string()), // "1 semaine", "1 mois"…
    remote: v.boolean(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  })
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  freelanceMissionBids: defineTable({
    missionId: v.id("freelanceMissions"),
    freelancerId: v.id("users"),
    proposal: v.string(),
    bidAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    submittedAt: v.string(),
  })
    .index("by_mission", ["missionId"])
    .index("by_freelancer", ["freelancerId"]),

  // Mentorat
  mentorProfiles: defineTable({
    userId: v.id("users"),
    expertise: v.array(v.string()),
    bio: v.string(),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    availability: v.string(), // texte libre: "lun-ven 18h-20h"
    languages: v.array(v.string()),
    totalSessions: v.number(),
    rating: v.optional(v.number()),
    verified: v.boolean(),
  }).index("by_user", ["userId"]),

  mentorSessions: defineTable({
    mentorId: v.id("users"),
    menteeId: v.id("users"),
    scheduledAt: v.string(), // ISO 8601
    durationMinutes: v.number(),
    topic: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show"),
    ),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
  })
    .index("by_mentor", ["mentorId"])
    .index("by_mentee", ["menteeId"])
    .index("by_status", ["status"]),

  // Parrainage
  referrals: defineTable({
    referrerId: v.id("users"),
    referredId: v.id("users"),
    code: v.string(), // code unique utilisé
    status: v.union(
      v.literal("pending"),
      v.literal("validated"),
      v.literal("rewarded"),
    ),
    rewardAmount: v.optional(v.number()),
    rewardCurrency: v.optional(v.string()),
    validatedAt: v.optional(v.string()),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred", ["referredId"])
    .index("by_code", ["code"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SANTÉ & BIEN-ÊTRE
  // ─────────────────────────────────────────────────────────────────────────
  medicalAppointments: defineTable({
    userId: v.id("users"),

    // Nouveau : référence canonique du professionnel.
    // Optional pour préserver les anciens rendez-vous déjà en base.
    professionalId: v.optional(v.id("medicalProfessionals")),

    doctorName: v.string(),
    specialty: v.string(),
    clinicName: v.optional(v.string()),

    // Date/heure ISO du rendez-vous.
    date: v.string(),

    // Nouveau : créneau réservé.
    slotStart: v.optional(v.string()),
    slotEnd: v.optional(v.string()),

    // Nouveau : timestamp canonique optionnel.
    scheduledAt: v.optional(v.string()),

    durationMinutes: v.number(),

    type: v.union(
      v.literal("consultation"),
      v.literal("teleconsultation"),
      v.literal("suivi"),
    ),

    notes: v.optional(v.string()),

    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),

    reminder: v.boolean(),
    location: v.optional(v.string()),

    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_professional_date", ["professionalId", "date"]),

  medicalAvailability: defineTable({
    professionalId: v.id("medicalProfessionals"),

    // Format strict : YYYY-MM-DD
    date: v.string(),

    slots: v.array(
      v.object({
        start: v.string(), // HH:mm
        end: v.string(), // HH:mm
      }),
    ),

    updatedAt: v.number(),
  })
    .index("by_professional", ["professionalId"])
    .index("by_professional_date", ["professionalId", "date"]),

  workoutSessions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.string(), // "force", "cardio", "yoga"…
    durationMinutes: v.number(),
    caloriesBurned: v.optional(v.number()),
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.optional(v.number()),
        reps: v.optional(v.number()),
        weightKg: v.optional(v.number()),
        durationSeconds: v.optional(v.number()),
      }),
    ),
    date: v.string(),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  nutritionLogs: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    meals: v.array(
      v.object({
        name: v.string(),
        time: v.string(),
        calories: v.optional(v.number()),
        proteins: v.optional(v.number()),
        carbs: v.optional(v.number()),
        fats: v.optional(v.number()),
        items: v.array(v.string()),
      }),
    ),
    totalCalories: v.optional(v.number()),
    waterMl: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  meditationSessions: defineTable({
    userId: v.id("users"),
    type: v.string(), // "respiration", "pleine conscience"…
    durationMinutes: v.number(),
    date: v.string(),
    moodBefore: v.optional(v.number()), // 1–5
    moodAfter: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  healthMetrics: defineTable({
    userId: v.id("users"),
    date: v.string(),
    weightKg: v.optional(v.number()),
    heightCm: v.optional(v.number()),
    bmi: v.optional(v.number()),
    bloodPressureSystolic: v.optional(v.number()),
    bloodPressureDiastolic: v.optional(v.number()),
    heartRateBpm: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
    stepsCount: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  sportClubs: defineTable({
    adminId: v.id("users"),
    name: v.string(),
    sport: v.string(),
    description: v.string(),
    logo: v.optional(v.string()),
    city: v.string(),
    memberCount: v.number(),
    isPublic: v.boolean(),
  })
    .index("by_admin", ["adminId"])
    .index("by_sport", ["sport"]),

  sportClubMembers: defineTable({
    clubId: v.id("sportClubs"),
    userId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("coach"), v.literal("admin")),
    joinedAt: v.string(),
  })
    .index("by_club", ["clubId"])
    .index("by_user", ["userId"])
    .index("by_club_and_user", ["clubId", "userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SANTÉ – PROFESSIONNELS, HÔPITAUX, PHARMACIES, LABOS, ETC.
  // ─────────────────────────────────────────────────────────────────────────

  medicalProfessionals: defineTable({
    userId: v.string(),
    name: v.string(),
    specialty: v.string(),
    fees: v.number(),
    currency: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    experience: v.number(),
    education: v.array(
      v.object({
        id: v.string(),
        institution: v.string(),
        degree: v.string(),
        year: v.optional(v.string()),
      }),
    ),
    specialities: v.array(v.string()),
    languages: v.array(v.string()),
    certificates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        issuer: v.string(),
        year: v.optional(v.string()),
      }),
    ),
    awards: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        year: v.string(),
        organization: v.optional(v.string()),
      }),
    ),
    insurances: v.array(v.string()),
    schedule: v.optional(v.string()),
    images: v.array(v.string()),
    badges: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        icon: v.string(),
        color: v.optional(v.string()),
      }),
    ),
    online: v.boolean(),
    verified: v.boolean(),
    available: v.boolean(),
    rating: v.number(),
    reviewCount: v.number(),
    patients: v.number(),
    appointments: v.number(),
    isLiked: v.boolean(),
    isFollowing: v.boolean(),
    isLive: v.boolean(),
    liveUrl: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("pending"),
      v.literal("suspended"),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_specialty", ["specialty"])
    .index("by_created", ["createdAt"]),

  hospitals: defineTable({
    name: v.string(),
    type: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    hours: v.string(),
    open: v.boolean(),
    priceRange: v.string(),
    beds: v.number(),
    occupiedBeds: v.number(),
    doctors: v.number(),
    specialties: v.number(),
    description: v.optional(v.string()),
    services: v.array(v.string()),
    images: v.array(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    emergency: v.boolean(),
    parking: v.boolean(),
    pharmacy: v.boolean(),
    cafeteria: v.boolean(),
    wifi: v.boolean(),
    ambulance: v.boolean(),
    rating: v.number(),
    reviewCount: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_city", ["city"])
    .index("by_emergency", ["emergency"]),

  pharmacies: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    hours: v.string(),
    open: v.boolean(),
    services: v.array(v.string()),
    images: v.array(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    delivery: v.boolean(),
    deliveryRadius: v.optional(v.number()),
    deliveryFee: v.optional(v.number()),
    onlineOrders: v.boolean(),
    acceptsInsurance: v.boolean(),
    insurances: v.optional(v.array(v.string())),
    products: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        dosage: v.string(),
        price: v.number(),
        currency: v.string(),
        stock: v.number(),
        prescriptionRequired: v.boolean(),
        category: v.string(),
        image: v.optional(v.string()),
        description: v.optional(v.string()),
        manufacturer: v.optional(v.string()),
        barcode: v.optional(v.string()),
      }),
    ),
    rating: v.number(),
    reviewCount: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_city", ["city"])
    .index("by_delivery", ["delivery"]),

  laboratories: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    hours: v.string(),
    open: v.boolean(),
    tests: v.number(),
    equipment: v.number(),
    testsList: v.array(v.string()),
    images: v.array(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    rating: v.number(),
    reviewCount: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_city", ["city"]),

  clinics: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    hours: v.string(),
    open: v.boolean(),
    specialties: v.array(v.string()),
    description: v.optional(v.string()),
    images: v.array(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    emergency: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_city", ["city"])
    .index("by_emergency", ["emergency"]),

  ambulances: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    phone: v.string(),
    emergencyPhone: v.string(),
    hours: v.string(),
    available: v.boolean(),
    vehicles: v.number(),
    paramedics: v.number(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_city", ["city"])
    .index("by_available", ["available"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SANTÉ – REVIEWS, QUESTIONS, FOLLOWERS, LIKES, CONTENU
  // ─────────────────────────────────────────────────────────────────────────

  reviews: defineTable({
    professionalId: v.id("medicalProfessionals"),
    patientId: v.id("users"),
    patientName: v.string(),
    rating: v.number(),
    comment: v.string(),
    date: v.string(),
    likes: v.number(),
    verified: v.boolean(),
    helpful: v.number(),
    images: v.optional(v.array(v.string())),
    response: v.optional(
      v.object({
        doctorId: v.id("medicalProfessionals"),
        doctorName: v.string(),
        content: v.string(),
        date: v.string(),
      }),
    ),
    status: v.union(
      v.literal("published"),
      v.literal("pending"),
      v.literal("flagged"),
      v.literal("hidden"),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_professional", ["professionalId"])
    .index("by_rating", ["rating"])
    .index("by_createdAt", ["createdAt"]),

  questions: defineTable({
    professionalId: v.id("medicalProfessionals"),
    patientId: v.id("users"),
    patientName: v.string(),
    question: v.string(),
    date: v.string(),
    likes: v.number(),
    answers: v.array(
      v.object({
        id: v.string(),
        authorId: v.id("users"),
        author: v.string(),
        content: v.string(),
        date: v.string(),
        likes: v.number(),
      }),
    ),
    status: v.union(
      v.literal("open"),
      v.literal("answered"),
      v.literal("closed"),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_professional", ["professionalId"])
    .index("by_status", ["status"]),

  followers: defineTable({
    professionalId: v.id("medicalProfessionals"),
    userId: v.id("users"),
    name: v.string(),
    avatar: v.optional(v.string()),
    followedAt: v.string(),
  })
    .index("by_professional", ["professionalId"])
    .index("by_user", ["userId"])
    .index("by_professional_and_user", ["professionalId", "userId"]),

  likes: defineTable({
    professionalId: v.id("medicalProfessionals"),
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_professional", ["professionalId"])
    .index("by_user", ["userId"])
    .index("by_professional_and_user", ["professionalId", "userId"]),

  articles: defineTable({
    professionalId: v.id("medicalProfessionals"),
    title: v.string(),
    excerpt: v.string(),
    date: v.string(),
    author: v.string(),
    authorId: v.id("users"),
    image: v.optional(v.string()),
    readTime: v.number(),
    views: v.number(),
    url: v.optional(v.string()),
  })
    .index("by_professional", ["professionalId"])
    .index("by_date", ["date"]),

  videos: defineTable({
    professionalId: v.id("medicalProfessionals"),
    title: v.string(),
    thumbnail: v.optional(v.string()),
    duration: v.string(),
    views: v.number(),
    date: v.string(),
    url: v.optional(v.string()),
  })
    .index("by_professional", ["professionalId"])
    .index("by_date", ["date"]),

  // Table "stories" déjà définie ailleurs dans le schéma (MÉDIAS & CRÉATION)
  // Table "emergencyContacts" déjà définie ailleurs
  // Table "emergencyAlerts" déjà définie ailleurs

  // ─────────────────────────────────────────────────────────────────────────
  // SANTÉ – DOSSIERS MÉDICAUX, PRESCRIPTIONS, VACCINATIONS
  // ─────────────────────────────────────────────────────────────────────────

  medicalRecords: defineTable({
    patientId: v.id("users"),
    doctorId: v.optional(v.id("medicalProfessionals")),
    type: v.union(
      v.literal("visit"),
      v.literal("lab"),
      v.literal("imaging"),
      v.literal("vaccination"),
      v.literal("prescription"),
      v.literal("surgery"),
      v.literal("hospitalization"),
    ),
    title: v.string(),
    date: v.string(),
    doctor: v.optional(v.string()),
    summary: v.string(),
    details: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_patient", ["patientId"])
    .index("by_type", ["type"])
    .index("by_date", ["date"]),

  prescriptions: defineTable({
    patientId: v.id("users"),
    patientName: v.string(),
    doctorId: v.id("medicalProfessionals"),
    doctorName: v.string(),
    date: v.string(),
    medications: v.array(
      v.object({
        name: v.string(),
        dosage: v.string(),
        frequency: v.string(),
        duration: v.string(),
        quantity: v.optional(v.number()),
        instructions: v.optional(v.string()),
        substitution: v.optional(v.boolean()),
      }),
    ),
    notes: v.optional(v.string()),
    validUntil: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled"),
      v.literal("dispensed"),
    ),
    pharmacyId: v.optional(v.id("pharmacies")),
    dispensedAt: v.optional(v.string()),
    refills: v.number(),
    refillsRemaining: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_patient", ["patientId"])
    .index("by_doctor", ["doctorId"])
    .index("by_status", ["status"]),

  vaccinations: defineTable({
    patientId: v.id("users"),
    name: v.string(),
    date: v.string(),
    nextDose: v.optional(v.string()),
    status: v.union(
      v.literal("completed"),
      v.literal("pending"),
      v.literal("overdue"),
    ),
    administeredBy: v.optional(v.string()),
    location: v.optional(v.string()),
    batchNumber: v.optional(v.string()),
    sideEffects: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SANTÉ – COMMANDES PHARMACIE, RENDEZ-VOUS HÔPITAL, TÉLÉCONSULTATIONS
  // ─────────────────────────────────────────────────────────────────────────

  pharmacyOrders: defineTable({
    pharmacyId: v.id("pharmacies"),
    patientId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.string(),
        quantity: v.number(),
        price: v.number(),
      }),
    ),
    total: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded"),
    ),
    deliveryOption: v.union(v.literal("pickup"), v.literal("delivery")),
    deliveryAddress: v.optional(v.string()),
    deliveryFee: v.optional(v.number()),
    paymentMethod: v.string(),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    deliveredAt: v.optional(v.string()),
  })
    .index("by_pharmacy", ["pharmacyId"])
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),

  hospitalAppointments: defineTable({
    hospitalId: v.id("hospitals"),
    hospitalName: v.string(),
    service: v.string(),
    date: v.string(),
    patientId: v.id("users"),
    patientName: v.string(),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_hospital", ["hospitalId"])
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),

  teleconsultations: defineTable({
    doctorId: v.id("medicalProfessionals"),
    patientId: v.id("users"),
    scheduledAt: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    durationMinutes: v.number(),
    roomUrl: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_doctor", ["doctorId"])
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),

  // ============================================================================
  // NETWORK MODULE TABLES
  // ============================================================================

  // ─── PROFIL RÉSEAU (extension du profil utilisateur) ─────────────────────────
  networkProfiles: defineTable({
    userId: v.id("users"),
    headline: v.optional(v.string()), // titre professionnel
    availability: v.optional(
      v.union(
        v.literal("available"),
        v.literal("limited"),
        v.literal("unavailable"),
      ),
    ),
    verified: v.optional(v.boolean()),
    reputationScore: v.optional(v.number()),
    website: v.optional(v.string()),
    socialLinks: v.optional(
      v.object({
        facebook: v.optional(v.string()),
        twitter: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        instagram: v.optional(v.string()),
        youtube: v.optional(v.string()),
      }),
    ),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // ─── EXPÉRIENCES PROFESSIONNELLES ────────────────────────────────────────────
  networkExperiences: defineTable({
    userId: v.id("users"),
    title: v.string(), // ex: "Développeur Full Stack"
    company: v.string(),
    location: v.optional(v.string()),
    startDate: v.string(), // ISO date
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
    achievements: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_current", ["userId", "current"]),

  // ─── FORMATIONS ──────────────────────────────────────────────────────────────
  networkEducations: defineTable({
    userId: v.id("users"),
    school: v.string(),
    degree: v.string(),
    field: v.optional(v.string()),
    location: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    current: v.boolean(),
    description: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_current", ["userId", "current"]),

  // ─── COMPÉTENCES ─────────────────────────────────────────────────────────────
  networkSkills: defineTable({
    userId: v.id("users"),
    name: v.string(),
    endorsements: v.number(),
    endorsedBy: v.array(v.id("users")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_name", ["userId", "name"]),

  // ─── CERTIFICATIONS ──────────────────────────────────────────────────────────
  networkCertifications: defineTable({
    userId: v.id("users"),
    name: v.string(),
    issuer: v.string(),
    issueDate: v.string(),
    expiryDate: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // ─── SERVICES PROPOSÉS ──────────────────────────────────────────────────────
  networkServices: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.string()),
    category: v.string(),
    location: v.optional(v.string()),
    deliveryTime: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"]),

  // ─── PORTFOLIO ──────────────────────────────────────────────────────────────
  networkPortfolio: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("document"),
      v.literal("link"),
    ),
    url: v.string(),
    thumbnail: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // ─── RECOMMANDATIONS ─────────────────────────────────────────────────────────
  networkRecommendations: defineTable({
    fromUserId: v.id("users"),
    fromName: v.string(),
    fromAvatar: v.optional(v.string()),
    receiverId: v.id("users"),
    rating: v.number(), // 1-5
    comment: v.string(),
    createdAt: v.string(),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_from", ["fromUserId"])
    .index("by_rating", ["rating"]),

  // ─── DEMANDES DE CONNEXION ──────────────────────────────────────────────────
  networkConnectionRequests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_pair", ["senderId", "receiverId"])
    .index("by_status", ["status"]),

  // ─── NOTIFICATIONS RÉSEAU ──────────────────────────────────────────────────
  networkNotifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("follow"),
      v.literal("connection_request"),
      v.literal("connection_accepted"),
      v.literal("recommendation"),
      v.literal("endorsement"),
      v.literal("comment"),
      v.literal("like"),
    ),
    fromUserId: v.optional(v.id("users")),
    fromName: v.optional(v.string()),
    fromAvatar: v.optional(v.string()),
    targetId: v.optional(v.string()), // peut être un id de publication, commentaire, etc.
    targetType: v.optional(v.string()),
    content: v.string(),
    read: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"])
    .index("by_createdAt", ["createdAt"]),

  // ─── ANALYTICS DU RÉSEAU ────────────────────────────────────────────────────
  networkAnalytics: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    profileViews: v.number(),
    connectionsGained: v.number(),
    connectionsLost: v.number(),
    postsEngagement: v.number(), // total likes + comments on own posts
    searchAppearances: v.number(),
    opportunitiesGenerated: v.number(), // jobs, services, etc.
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // ─── SAVOIR-FAIRE / PORTFOLIO SUPPLEMENTAIRE ───────────────────────────────
  networkProjects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    url: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // ÉDUCATION
  // ─────────────────────────────────────────────────────────────────────────
  courses: defineTable({
    instructorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    level: v.union(
      v.literal("debutant"),
      v.literal("intermediaire"),
      v.literal("avance"),
    ),
    language: v.string(),
    coverImage: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    isFree: v.boolean(),
    duration: v.optional(v.string()), // "4h30"
    lessonCount: v.number(),
    enrollmentCount: v.number(),
    rating: v.optional(v.number()),
    tags: v.array(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
  })
    .index("by_instructor", ["instructorId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .searchIndex("search_courses", {
      searchField: "title",
      filterFields: ["category", "status"],
    }),

  courseLessons: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    content: v.string(), // texte markdown
    videoUrl: v.optional(v.string()),
    order: v.number(),
    durationMinutes: v.optional(v.number()),
    isFree: v.boolean(), // preview gratuit
  })
    .index("by_course", ["courseId"])
    .index("by_course_and_order", ["courseId", "order"]),

  courseEnrollments: defineTable({
    courseId: v.id("courses"),
    userId: v.id("users"),
    enrolledAt: v.string(),
    completedAt: v.optional(v.string()),
    progressPct: v.number(), // 0–100
    lastLessonId: v.optional(v.id("courseLessons")),
  })
    .index("by_course", ["courseId"])
    .index("by_user", ["userId"])
    .index("by_course_and_user", ["courseId", "userId"]),

  lessonProgress: defineTable({
    lessonId: v.id("courseLessons"),
    userId: v.id("users"),
    completedAt: v.optional(v.string()),
  })
    .index("by_lesson", ["lessonId"])
    .index("by_user", ["userId"])
    .index("by_lesson_and_user", ["lessonId", "userId"]),

  quizzes: defineTable({
    courseId: v.optional(v.id("courses")),
    creatorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        explanation: v.optional(v.string()),
      }),
    ),
    timeLimit: v.optional(v.number()), // minutes
    passingScore: v.number(), // 0–100
    isPublic: v.boolean(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_course", ["courseId"]),

  quizAttempts: defineTable({
    quizId: v.id("quizzes"),
    userId: v.id("users"),
    score: v.number(), // 0–100
    answers: v.array(v.number()), // selected option index per question
    completedAt: v.string(),
    passed: v.boolean(),
  })
    .index("by_quiz", ["quizId"])
    .index("by_user", ["userId"]),

  certificates: defineTable({
    userId: v.id("users"),
    courseId: v.optional(v.id("courses")),
    title: v.string(),
    issuer: v.string(),
    issuedAt: v.string(),
    expiresAt: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
    verified: v.boolean(),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SOCIAL & GROUPES
  // ─────────────────────────────────────────────────────────────────────────
  groups: defineTable({
    adminId: v.id("users"),
    name: v.string(),
    description: v.string(),
    coverImage: v.optional(v.string()),
    avatar: v.optional(v.string()),
    category: v.string(),
    isPrivate: v.boolean(),
    memberCount: v.number(),
    city: v.optional(v.string()),
    tags: v.array(v.string()),
  })
    .index("by_admin", ["adminId"])
    .index("by_category", ["category"])
    .searchIndex("search_groups", {
      searchField: "name",
      filterFields: ["category"],
    }),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(
      v.literal("member"),
      v.literal("moderator"),
      v.literal("admin"),
    ),
    joinedAt: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("banned"),
    ),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_and_user", ["groupId", "userId"])
    .index("by_status", ["status"]),

  groupPosts: defineTable({
    groupId: v.id("groups"),
    authorId: v.id("users"),
    content: v.string(),
    images: v.array(v.string()),
    likeCount: v.number(),
    commentCount: v.number(),
    pinned: v.boolean(),
  })
    .index("by_group", ["groupId"])
    .index("by_author", ["authorId"]),

  // ONG & Dons
  ngoProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    mission: v.string(),
    description: v.string(),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.string(), // "humanitaire", "environnement", "education"…
    city: v.string(),
    country: v.string(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    verified: v.boolean(),
    totalDonations: v.number(),
    donorCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"]),

  ngoCampaigns: defineTable({
    ngoId: v.id("ngoProfiles"),
    title: v.string(),
    description: v.string(),
    goal: v.number(),
    currency: v.string(),
    raised: v.number(),
    donorCount: v.number(),
    coverImage: v.optional(v.string()),
    deadline: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  })
    .index("by_ngo", ["ngoId"])
    .index("by_status", ["status"]),

  donations: defineTable({
    campaignId: v.id("ngoCampaigns"),
    donorId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    anonymous: v.boolean(),
    message: v.optional(v.string()),
    paidAt: v.string(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_donor", ["donorId"]),

  // Réputation
  reputationEvents: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("publication_liked"),
      v.literal("comment_liked"),
      v.literal("followed"),
      v.literal("review_received"),
      v.literal("sale_completed"),
      v.literal("badge_earned"),
      v.literal("verified"),
    ),
    points: v.number(),
    sourceId: v.optional(v.string()),
    description: v.string(),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILITÉ & VOYAGES
  // ─────────────────────────────────────────────────────────────────────────

  transportRoutes: defineTable({
    driverId: v.id("users"),
    companyId: v.optional(v.id("transportCompanies")),

    origin: v.string(),
    destination: v.string(),
    departureTime: v.string(), // ISO 8601 ou planifié
    arrivalTime: v.optional(v.string()),

    vehicleType: v.union(
      v.literal("taxi"),
      v.literal("bus"),
      v.literal("moto"),
      v.literal("minibus"),
      v.literal("voiture"),
      v.literal("camion"),
      v.literal("rideshare"),
    ),

    seats: v.number(),
    seatsAvailable: v.number(),
    pricePerSeat: v.number(),
    currency: v.string(),

    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("active"),
    ),

    // Champs optionnels pour l'adaptation selon la catégorie de service (Solution A)
    driverName: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),

    vehicleModel: v.optional(v.string()),
    vehiclePlate: v.optional(v.string()),
    pricePerKm: v.optional(v.number()),

    capacity: v.optional(v.number()),
    weight: v.optional(v.number()),
    volume: v.optional(v.number()),

    routeName: v.optional(v.string()),
    schedule: v.optional(v.string()),
    ticketPrice: v.optional(v.number()),

    amenities: v.optional(v.array(v.string())),
    luggageAllowed: v.optional(v.boolean()),
    petsAllowed: v.optional(v.boolean()),
    accessibility: v.optional(v.boolean()),
    insuranceIncluded: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
    description: v.optional(v.string()),

    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),

    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  })
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"])
    .index("by_departureTime", ["departureTime"]),

  transportBookings: defineTable({
    routeId: v.id("transportRoutes"),
    userId: v.id("users"),
    driverId: v.optional(v.union(v.id("users"), v.id("transportDrivers"))),
    companyId: v.optional(v.id("transportCompanies")),

    seats: v.number(),
    totalAmount: v.number(),
    currency: v.string(),

    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
    ),

    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    departureTime: v.optional(v.string()),
    notes: v.optional(v.string()),

    bookedAt: v.string(),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  })
    .index("by_route", ["routeId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPORT DRIVERS
  // ─────────────────────────────────────────────────────────────────────────

  transportDrivers: defineTable({
    userId: v.id("users"),

    name: v.string(),
    phone: v.string(),

    email: v.optional(v.string()),
    address: v.optional(v.string()),

    city: v.string(),
    country: v.string(),

    licenseNumber: v.string(),
    licenseExpiry: v.string(),

    vehicleModel: v.string(),
    vehicleColor: v.string(),
    licensePlate: v.string(),

    vehicleType: v.union(
      v.literal("taxi"),
      v.literal("bus"),
      v.literal("moto"),
      v.literal("minibus"),
      v.literal("voiture"),
      v.literal("camion"),
    ),

    seats: v.number(),

    available: v.boolean(),

    rating: v.number(),
    reviewCount: v.number(),
    trips: v.number(),

    bio: v.optional(v.string()),

    languages: v.optional(v.array(v.string())),
    documents: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),

    companyId: v.optional(v.string()),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_city", ["city"])
    .index("by_vehicle", ["vehicleType"])
    .index("by_company", ["companyId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPORT COMPANIES
  // ─────────────────────────────────────────────────────────────────────────

  transportCompanies: defineTable({
    name: v.string(),
    description: v.optional(v.string()),

    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),

    address: v.optional(v.string()),
    city: v.string(),
    country: v.string(),

    logo: v.optional(v.string()),
    images: v.optional(v.array(v.string())),

    verified: v.boolean(),

    rating: v.number(),
    reviewCount: v.number(),

    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_city", ["city"]),

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPORT VEHICLES
  // ─────────────────────────────────────────────────────────────────────────

  transportVehicles: defineTable({
    driverId: v.id("transportDrivers"),

    type: v.string(),
    brand: v.string(),
    model: v.string(),
    color: v.string(),

    plateNumber: v.string(),

    seats: v.number(),

    year: v.optional(v.number()),

    insuranceExpiry: v.optional(v.string()),
    technicalInspection: v.optional(v.string()),

    images: v.optional(v.array(v.string())),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_driver", ["driverId"])
    .index("by_plate", ["plateNumber"]),

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPORT REVIEWS
  // ─────────────────────────────────────────────────────────────────────────

  transportReviews: defineTable({
    userId: v.id("users"),
    userName: v.optional(v.string()),

    driverId: v.optional(v.id("transportDrivers")),
    companyId: v.optional(v.id("transportCompanies")),
    bookingId: v.optional(v.id("transportBookings")),

    rating: v.number(),
    comment: v.optional(v.string()),

    likes: v.optional(v.number()),
    helpful: v.optional(v.number()),
    status: v.optional(v.string()),

    date: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_driver", ["driverId"])
    .index("by_company", ["companyId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPORT QUESTIONS
  // ─────────────────────────────────────────────────────────────────────────

  transportQuestions: defineTable({
    userId: v.id("users"),
    userName: v.optional(v.string()),

    driverId: v.optional(v.id("transportDrivers")),
    companyId: v.optional(v.id("transportCompanies")),

    question: v.string(),
    answer: v.optional(v.string()),

    likes: v.optional(v.number()),
    status: v.optional(v.string()),

    answers: v.optional(
      v.array(
        v.object({
          id: v.string(),
          authorId: v.id("users"),
          author: v.string(),
          content: v.string(),
          date: v.string(),
          likes: v.number(),
        }),
      ),
    ),

    date: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_driver", ["driverId"])
    .index("by_company", ["companyId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPORT PAYMENTS
  // ─────────────────────────────────────────────────────────────────────────

  transportPayments: defineTable({
    bookingId: v.id("transportBookings"),
    userId: v.optional(v.id("users")),

    transactionId: v.string(),

    amount: v.number(),
    currency: v.string(),
    method: v.optional(v.string()),

    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded"),
    ),

    provider: v.optional(v.string()),
    metadata: v.optional(v.any()),

    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_booking", ["bookingId"])
    .index("by_transaction", ["transactionId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSPORT TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  transportTracking: defineTable({
    bookingId: v.id("transportBookings"),

    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),

    // Fallback de structures de suivi
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),

    speed: v.optional(v.number()),
    heading: v.optional(v.number()),

    timestamp: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_booking", ["bookingId"]),

  deliveries: defineTable({
    senderId: v.id("users"),
    driverId: v.optional(v.id("users")),
    description: v.string(),
    pickupAddress: v.string(),
    deliveryAddress: v.string(),
    weightKg: v.optional(v.number()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    scheduledAt: v.optional(v.string()),
    estimatedDelivery: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("assigned"),
      v.literal("picked_up"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
    trackingCode: v.string(),
  })
    .index("by_sender", ["senderId"])
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"])
    .index("by_trackingCode", ["trackingCode"]),

  travelPlans: defineTable({
    userId: v.id("users"),
    title: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    travelers: v.number(),
    totalBudget: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("confirmed"),
      v.literal("completed"),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_startDate", ["startDate"]),

  travelEntries: defineTable({
    planId: v.id("travelPlans"),
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    date: v.string(),
    images: v.array(v.string()),
    location: v.optional(v.string()),
    mood: v.optional(v.string()),
  })
    .index("by_plan", ["planId"])
    .index("by_date", ["date"]),

  travelExpenses: defineTable({
    planId: v.id("travelPlans"),
    userId: v.id("users"),
    category: v.string(), // "transport", "hébergement", "nourriture"…
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
  })
    .index("by_plan", ["planId"])
    .index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // AGRICULTURE & ENVIRONNEMENT
  // ─────────────────────────────────────────────────────────────────────────
  farmProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    location: v.string(),
    city: v.string(),
    surfaceHa: v.optional(v.number()),
    primaryCrop: v.optional(v.string()),
    images: v.array(v.string()),
    verified: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_city", ["city"]),

  cropRecords: defineTable({
    farmId: v.id("farmProfiles"),
    userId: v.id("users"),
    cropName: v.string(),
    variety: v.optional(v.string()),
    plantedAt: v.string(),
    harvestedAt: v.optional(v.string()),
    surfaceHa: v.optional(v.number()),
    yieldKg: v.optional(v.number()),
    status: v.union(
      v.literal("planted"),
      v.literal("growing"),
      v.literal("harvested"),
      v.literal("failed"),
    ),
    notes: v.optional(v.string()),
  })
    .index("by_farm", ["farmId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  ecoActions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("recycling"),
      v.literal("tree_planting"),
      v.literal("clean_up"),
      v.literal("energy_saving"),
      v.literal("water_saving"),
      v.literal("other"),
    ),
    description: v.string(),
    impactPoints: v.number(),
    date: v.string(),
    images: v.array(v.string()),
    location: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  energyReadings: defineTable({
    userId: v.id("users"),
    date: v.string(),
    source: v.union(
      v.literal("solaire"),
      v.literal("reseau"),
      v.literal("generateur"),
      v.literal("autre"),
    ),
    kwh: v.number(),
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  // ─────────────────────────────────────────────────────────────────────────
  // AGRICULTURE
  // ─────────────────────────────────────────────────────────────────────────

  agriProducts: defineTable({
    title: v.string(),
    description: v.string(),

    category: v.string(),
    subcategory: v.optional(v.string()),
    variety: v.optional(v.string()),

    quality: v.string(),
    condition: v.optional(v.string()),

    pricing: v.object({
      price: v.number(),
      currency: v.string(),
      priceUnit: v.string(),
      negotiable: v.boolean(),
    }),

    quantity: v.object({
      available: v.number(),
      unit: v.string(),
      minimumOrder: v.optional(v.number()),
    }),

    location: v.object({
      country: v.string(),
      province: v.optional(v.string()),
      city: v.string(),
      territory: v.optional(v.string()),
    }),

    delivery: v.object({
      available: v.boolean(),
      radius: v.optional(v.number()),
      price: v.optional(v.number()),
      pickupAvailable: v.boolean(),
    }),

    // État réel de disponibilité du produit
    availability: v.optional(
      v.object({
        status: v.union(
          v.literal("available"),
          v.literal("limited"),
          v.literal("sold_out"),
          v.literal("unavailable"),
        ),
      }),
    ),

    media: v.object({
      images: v.array(v.string()),
    }),

    seller: v.object({
      userId: v.id("users"),
      name: v.string(),
      verified: v.boolean(),
      rating: v.number(),
      reviewCount: v.number(),
      joinedAt: v.string(),
    }),

    stats: v.object({
      views: v.number(),
      favorites: v.number(),
      contacts: v.number(),
    }),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_category", ["category"])
    .index("by_seller", ["seller.userId"])
    .index("by_city", ["location.city"])
    .index("by_createdAt", ["createdAt"]),

  agriBookings: defineTable({
    userId: v.id("users"),
    productId: v.id("agriProducts"),

    quantity: v.number(),

    totalAmount: v.number(),
    currency: v.string(),

    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
    ),

    message: v.optional(v.string()),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_product_and_status", ["productId", "status"]),

  agriReviews: defineTable({
    productId: v.id("agriProducts"),
    reviewerId: v.id("users"),

    authorName: v.string(),

    rating: v.number(),
    comment: v.optional(v.string()),

    bookingId: v.id("agriBookings"),
  })
    .index("by_product", ["productId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_booking", ["bookingId"])
    .index("by_product_and_reviewer", ["productId", "reviewerId"]),

  agriFavorites: defineTable({
    userId: v.id("users"),
    productId: v.id("agriProducts"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_user_and_product", ["userId", "productId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // MÉDIAS & CRÉATION
  // ─────────────────────────────────────────────────────────────────────────
  mediaArticles: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(), // markdown
    excerpt: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    viewCount: v.number(),
    likeCount: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    publishedAt: v.optional(v.string()),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .searchIndex("search_articles", {
      searchField: "title",
      filterFields: ["category", "status"],
    }),

  stories: defineTable({
    authorId: v.id("users"),
    mediaUrl: v.string(), // image or video CDN URL
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
    duration: v.optional(v.number()), // seconds for video
    viewCount: v.number(),
    expiresAt: v.string(), // ISO 8601 (24h after creation)
    isHighlight: v.boolean(),
  })
    .index("by_author", ["authorId"])
    .index("by_expiresAt", ["expiresAt"]),

  storyViews: defineTable({
    storyId: v.id("stories"),
    viewerId: v.id("users"),
    viewedAt: v.string(),
  })
    .index("by_story", ["storyId"])
    .index("by_viewer", ["viewerId"]),

  adCampaigns: defineTable({
    advertiserId: v.id("users"),
    title: v.string(),
    description: v.string(),
    mediaUrl: v.optional(v.string()),
    targetUrl: v.optional(v.string()),
    budget: v.number(),
    currency: v.string(),
    spent: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    targetAudience: v.optional(v.string()), // JSON string of targeting criteria
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
    ),
  })
    .index("by_advertiser", ["advertiserId"])
    .index("by_status", ["status"]),

  collaborativeProjects: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.array(v.string()),
    maxContributors: v.optional(v.number()),
    contributorCount: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
  })
    .index("by_creator", ["creatorId"])
    .index("by_status", ["status"]),

  projectContributors: defineTable({
    projectId: v.id("collaborativeProjects"),
    userId: v.id("users"),
    role: v.string(),
    joinedAt: v.string(),
    status: v.union(v.literal("active"), v.literal("left")),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // GOUVERNANCE & SÉCURITÉ
  // ─────────────────────────────────────────────────────────────────────────
  legalCases: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("civil"),
      v.literal("penal"),
      v.literal("administratif"),
      v.literal("commercial"),
      v.literal("travail"),
      v.literal("famille"),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("filed"),
      v.literal("in_review"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    documents: v.array(v.string()), // CDN URLs
    assignedLawyerId: v.optional(v.id("users")),
    createdAt: v.string(),
    resolvedAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  urbanProjects: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("route"),
      v.literal("ecole"),
      v.literal("hopital"),
      v.literal("marche"),
      v.literal("parc"),
      v.literal("infrastructure"),
      v.literal("autre"),
    ),
    city: v.string(),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    images: v.array(v.string()),
    status: v.union(
      v.literal("proposed"),
      v.literal("approved"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    likeCount: v.number(),
    commentCount: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_city", ["city"])
    .index("by_status", ["status"]),

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCES & WALLET — LEDGER
  // ─────────────────────────────────────────────────────────────────────────
  //
  // IMPORTANT :
  // - Cette table représente le ledger financier interne.
  // - Elle ne doit JAMAIS être modifiée directement par le client pour
  //   confirmer un paiement.
  // - Une entrée "completed" doit provenir d'un événement financier
  //   réellement confirmé par le Payment Core.
  // - Les mutations publiques de type addWalletTransaction doivent
  //   disparaître du flux utilisateur.
  //
  walletTransactions: defineTable({
    // Propriétaire du mouvement financier.
    userId: v.id("users"),

    // Nature comptable du mouvement.
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("transfer"),
      v.literal("payment"),
      v.literal("refund"),
      v.literal("reward"),
    ),

    // Montant dans la devise indiquée.
    //
    // IMPORTANT :
    // La valeur doit être interprétée exactement comme définie par
    // le Payment Core. Aucun calcul de change implicite.
    amount: v.number(),

    // ISO 4217 : USD, CDF, EUR, etc.
    currency: v.string(),

    description: v.string(),

    // Etat comptable.
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),

    // Référence métier éventuelle :
    // orderId, bookingId, missionId, etc.
    referenceId: v.optional(v.string()),

    // Contrepartie interne éventuelle.
    counterpartId: v.optional(v.id("users")),

    // Date de finalisation comptable.
    completedAt: v.optional(v.string()),

    // Rail/provider externe.
    provider: v.optional(
      v.union(
        v.literal("orange_money"),
        v.literal("mpesa"),
        v.literal("airtel_money"),
        v.literal("mtn_momo"),
        v.literal("internal"),
      ),
    ),

    // Payment Core.
    //
    // Ces références permettent de reconstruire la chaîne :
    //
    // paymentIntent
    //      ↓
    // paymentAttempt
    //      ↓
    // walletTransaction
    //
    paymentIntentId: v.optional(v.id("paymentIntents")),
    paymentAttemptId: v.optional(v.id("paymentAttempts")),

    // Identifiant externe fourni par le provider.
    //
    // Il ne doit jamais être généré artificiellement par le client.
    externalReference: v.optional(v.string()),

    // Identifiant technique du ledger.
    //
    // Généré côté serveur pour assurer la traçabilité.
    ledgerReference: v.optional(v.string()),

    // Métadonnées non sensibles.
    //
    // Ne jamais y stocker :
    // - secret API
    // - token OAuth
    // - PIN
    // - mot de passe
    // - clé privée
    // - données KYC sensibles
    metadata: v.optional(v.record(v.string(), v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_currency", ["userId", "currency"])
    .index("by_payment_intent", ["paymentIntentId"])
    .index("by_payment_attempt", ["paymentAttemptId"])
    .index("by_external_reference", ["externalReference"])
    .index("by_ledger_reference", ["ledgerReference"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT CORE — PAYMENT INTENTS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Un Payment Intent représente UNE opération financière métier.
  //
  // Exemple :
  //
  //   utilisateur souhaite créditer son wallet de 50 USD
  //
  //             ↓
  //
  //       PaymentIntent
  //             ↓
  //       PaymentAttempt
  //             ↓
  //       Provider réel
  //             ↓
  //       Confirmation vérifiée
  //             ↓
  //       Ledger
  //
  // IMPORTANT :
  //
  // PaymentIntent ≠ preuve de paiement.
  //
  // Le client peut demander la création d'un Intent.
  // Le client ne peut jamais déclarer que cet Intent est réussi.
  //
  // ═══════════════════════════════════════════════════════════════════════════

  paymentIntents: defineTable({
    /**
     * Propriétaire de l'opération.
     */
    userId: v.id("users"),

    /**
     * Type métier de l'opération.
     */
    type: v.union(
      v.literal("wallet_topup"),
      v.literal("wallet_withdrawal"),
      v.literal("merchant_payment"),
      v.literal("peer_transfer"),
      v.literal("refund"),
    ),

    /**
     * Direction financière.
     *
     * inbound  = argent entrant dans le wallet / système
     * outbound = argent sortant du wallet / système
     */
    direction: v.union(v.literal("inbound"), v.literal("outbound")),

    /**
     * Montant exact demandé.
     *
     * Aucun arrondi implicite.
     * Aucun calcul de change implicite.
     */
    amount: v.number(),

    /**
     * Devise exacte de l'opération.
     *
     * Exemple :
     * USD
     * CDF
     */
    currency: v.string(),

    /**
     * Provider sélectionné.
     *
     * Le Payment Core ne considère pas un provider comme
     * disponible simplement parce qu'il existe dans le schema :
     * l'adapter doit être configuré et opérationnel côté serveur.
     */
    provider: v.union(
      v.literal("orange_money"),
      v.literal("mpesa"),
      v.literal("airtel_money"),
      v.literal("mtn_momo"),
    ),

    /**
     * Référence du payeur / bénéficiaire.
     *
     * Peut contenir un numéro de téléphone.
     *
     * DONNÉE POTENTIELLEMENT SENSIBLE :
     * ne jamais l'exposer inutilement dans les queries publiques.
     */
    customerReference: v.optional(v.string()),

    /**
     * Référence métier de l'opération.
     *
     * Exemples :
     * - orderId
     * - bookingId
     * - serviceId
     * - invoiceId
     */
    referenceId: v.optional(v.string()),

    /**
     * Clé d'idempotence fournie par le client.
     *
     * IMPORTANT :
     *
     * L'idempotence métier est scoped au propriétaire :
     *
     *   userId + idempotencyKey
     *
     * doivent identifier une même opération logique.
     *
     * Le serveur doit refuser la création d'un nouvel Intent
     * lorsque cette paire existe déjà.
     */
    idempotencyKey: v.string(),

    /**
     * Etat du Payment Intent.
     *
     * created:
     *   Intent créé, aucune soumission confirmée.
     *
     * requires_action:
     *   Une action utilisateur est nécessaire.
     *
     * processing:
     *   Le provider traite l'opération.
     *
     * succeeded:
     *   Succès confirmé par le Payment Core.
     *
     * failed:
     *   Echec confirmé.
     *
     * cancelled:
     *   Opération annulée.
     *
     * expired:
     *   Intent arrivé à expiration.
     */
    status: v.union(
      v.literal("created"),
      v.literal("requires_action"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("expired"),
    ),

    /**
     * Référence externe finale.
     *
     * Cette valeur doit provenir du provider.
     *
     * Elle ne doit jamais être fabriquée côté client.
     */
    externalReference: v.optional(v.string()),

    /**
     * Code d'erreur normalisé.
     *
     * Aucun secret ni détail interne sensible.
     */
    failureCode: v.optional(v.string()),

    /**
     * Message technique non sensible destiné à l'application.
     */
    failureMessage: v.optional(v.string()),

    /**
     * Action attendue de l'utilisateur.
     *
     * Exemple :
     *
     * {
     *   type: "approve_mobile_money",
     *   message: "Confirmez la demande sur votre téléphone"
     * }
     *
     * Aucun token, secret ou credential ne doit être stocké ici.
     */
    nextAction: v.optional(
      v.object({
        type: v.union(v.literal("approve_mobile_money"), v.literal("none")),
        message: v.optional(v.string()),
      }),
    ),

    /**
     * Timestamp de création.
     */
    createdAt: v.number(),

    /**
     * Timestamp de dernière modification.
     */
    updatedAt: v.number(),

    /**
     * Timestamp du succès réellement confirmé.
     */
    succeededAt: v.optional(v.number()),

    /**
     * Timestamp de l'échec réellement confirmé.
     */
    failedAt: v.optional(v.number()),

    /**
     * Timestamp d'expiration.
     */
    expiresAt: v.optional(v.number()),
  })
    /**
     * Toutes les opérations d'un utilisateur.
     */
    .index("by_user", ["userId"])

    /**
     * Filtrage utilisateur + état.
     */
    .index("by_user_status", ["userId", "status"])

    /**
     * Recherche globale par état.
     */
    .index("by_status", ["status"])

    /**
     * Recherche par provider.
     */
    .index("by_provider", ["provider"])

    /**
     * Index historique / compatibilité.
     *
     * NE DOIT PAS être utilisé seul pour garantir
     * l'idempotence métier.
     */
    .index("by_idempotency", ["idempotencyKey"])

    /**
     * INDEX D'IDEMPOTENCE PRINCIPAL.
     *
     * Une opération logique est identifiée par :
     *
     *   userId + idempotencyKey
     */
    .index("by_user_idempotency", ["userId", "idempotencyKey"])

    /**
     * Recherche par référence externe.
     */
    .index("by_external_reference", ["externalReference"])

    /**
     * Recherche par référence métier.
     */
    .index("by_reference", ["referenceId"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT CORE — PAYMENT ATTEMPTS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Un Payment Intent peut avoir plusieurs tentatives.
  //
  // Exemple :
  //
  //   Intent #1
  //      │
  //      ├── Attempt #1 → timeout
  //      │
  //      ├── Attempt #2 → processing
  //      │
  //      └── Attempt #3 → succeeded
  //
  // Le retry crée une nouvelle tentative technique,
  // PAS un nouveau paiement métier.
  //
  // IMPORTANT :
  //
  // Une tentative ne devient "succeeded" qu'après
  // confirmation réelle du provider.
  //
  // ═══════════════════════════════════════════════════════════════════════════

  paymentAttempts: defineTable({
    /**
     * Payment Intent parent.
     */
    paymentIntentId: v.id("paymentIntents"),

    /**
     * Propriétaire.
     *
     * Doit correspondre au userId du PaymentIntent.
     */
    userId: v.id("users"),

    /**
     * Provider utilisé pour cette tentative.
     */
    provider: v.union(
      v.literal("orange_money"),
      v.literal("mpesa"),
      v.literal("airtel_money"),
      v.literal("mtn_momo"),
    ),

    /**
     * Numéro séquentiel de tentative.
     *
     * Exemple :
     * 1 → première tentative
     * 2 → premier retry
     * 3 → deuxième retry
     */
    attemptNumber: v.number(),

    /**
     * Etat technique de la tentative.
     */
    status: v.union(
      v.literal("created"),
      v.literal("submitted"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("unknown"),
    ),

    /**
     * Identifiant réel de transaction fourni par le provider.
     *
     * JAMAIS généré artificiellement.
     */
    providerTransactionId: v.optional(v.string()),

    /**
     * Référence provider complémentaire.
     */
    providerReference: v.optional(v.string()),

    /**
     * Code d'erreur normalisé.
     */
    errorCode: v.optional(v.string()),

    /**
     * Message d'erreur non sensible.
     */
    errorMessage: v.optional(v.string()),

    /**
     * Création de la tentative.
     */
    createdAt: v.number(),

    /**
     * Dernière modification.
     */
    updatedAt: v.number(),

    /**
     * Moment où la requête a effectivement été envoyée
     * au provider.
     */
    submittedAt: v.optional(v.number()),

    /**
     * Moment de confirmation réelle.
     */
    succeededAt: v.optional(v.number()),

    /**
     * Moment de l'échec confirmé.
     */
    failedAt: v.optional(v.number()),
  })
    /**
     * Toutes les tentatives d'un Intent.
     */
    .index("by_intent", ["paymentIntentId"])

    /**
     * Intent + état.
     *
     * Permet notamment de rechercher rapidement
     * une tentative active.
     */
    .index("by_intent_status", ["paymentIntentId", "status"])

    /**
     * Toutes les tentatives d'un utilisateur.
     */
    .index("by_user", ["userId"])

    /**
     * Tentatives par provider.
     */
    .index("by_provider", ["provider"])

    /**
     * Recherche directe d'une transaction provider.
     */
    .index("by_provider_transaction", ["providerTransactionId"])

    /**
     * Recherche par état.
     */
    .index("by_status", ["status"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT CORE — PROVIDER EVENTS / WEBHOOKS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Journal des événements reçus depuis les providers.
  //
  // Cette table permet :
  //
  // - idempotence
  // - audit
  // - réconciliation
  // - diagnostic
  // - retry contrôlé
  // - traçabilité réglementaire
  //
  // IMPORTANT :
  //
  // Un même événement provider ne doit jamais être appliqué
  // deux fois au ledger.
  //
  // La vérification cryptographique du webhook doit avoir lieu
  // AVANT l'insertion de l'événement ici.
  //
  // ═══════════════════════════════════════════════════════════════════════════

  paymentProviderEvents: defineTable({
    /**
     * Provider source.
     */
    provider: v.union(
      v.literal("orange_money"),
      v.literal("mpesa"),
      v.literal("airtel_money"),
      v.literal("mtn_momo"),
    ),

    /**
     * Identifiant événement fourni par le provider.
     *
     * Cet identifiant est la clé d'idempotence externe.
     */
    providerEventId: v.string(),

    /**
     * Identifiant de transaction provider.
     *
     * Peut être absent pour certains événements techniques.
     */
    providerTransactionId: v.optional(v.string()),

    /**
     * Payment Intent associé.
     *
     * Peut être absent si l'événement n'a pas encore pu
     * être réconcilié.
     */
    paymentIntentId: v.optional(v.id("paymentIntents")),

    /**
     * Payment Attempt associé.
     */
    paymentAttemptId: v.optional(v.id("paymentAttempts")),

    /**
     * Type d'événement normalisé.
     */
    eventType: v.union(
      v.literal("payment_pending"),
      v.literal("payment_processing"),
      v.literal("payment_succeeded"),
      v.literal("payment_failed"),
      v.literal("payment_cancelled"),
      v.literal("payment_reversed"),
      v.literal("unknown"),
    ),

    /**
     * Etat du traitement interne.
     */
    processingStatus: v.union(
      v.literal("received"),
      v.literal("processed"),
      v.literal("ignored"),
      v.literal("failed"),
    ),

    /**
     * Signature reçue du provider.
     *
     * IMPORTANT :
     *
     * La présence d'une signature ne signifie PAS
     * qu'elle est valide.
     *
     * Elle doit être cryptographiquement vérifiée
     * avant que l'événement puisse avoir un effet financier.
     */
    signature: v.optional(v.string()),

    /**
     * Empreinte du payload.
     *
     * Permet de détecter une modification du contenu
     * lors des opérations d'audit.
     */
    payloadHash: v.optional(v.string()),

    /**
     * Payload brut minimisé.
     *
     * Aucun secret ne doit être conservé ici.
     *
     * INTERDIT :
     * - access token
     * - API key
     * - PIN
     * - mot de passe
     * - clé privée
     * - credential
     */
    rawPayload: v.optional(v.string()),

    /**
     * Erreur interne de traitement.
     *
     * Aucun secret dans ce champ.
     */
    processingError: v.optional(v.string()),

    /**
     * Timestamp de réception.
     */
    receivedAt: v.number(),

    /**
     * Timestamp de traitement final.
     */
    processedAt: v.optional(v.number()),
  })
    /**
     * ═══════════════════════════════════════════════════════════════════════
     * IDEMPOTENCE PROVIDER
     * ═══════════════════════════════════════════════════════════════════════
     *
     * Un couple :
     *
     *   provider + providerEventId
     *
     * représente un événement logique unique.
     */
    .index("by_provider_event", ["provider", "providerEventId"])

    /**
     * Recherche par provider.
     */
    .index("by_provider", ["provider"])

    /**
     * Recherche par transaction provider.
     */
    .index("by_provider_transaction", ["providerTransactionId"])

    /**
     * Recherche par Payment Intent.
     */
    .index("by_intent", ["paymentIntentId"])

    /**
     * Recherche par Payment Attempt.
     */
    .index("by_attempt", ["paymentAttemptId"])

    /**
     * File des événements selon leur état de traitement.
     */
    .index("by_processing_status", ["processingStatus"])

    /**
     * Ordre chronologique des événements.
     */
    .index("by_received_at", ["receivedAt"]),
  // ─────────────────────────────────────────────────────────────────────────
  // FINANCES — BUDGETS
  // ─────────────────────────────────────────────────────────────────────────

  budgets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    period: v.union(
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("custom"),
    ),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    categories: v.array(
      v.object({
        name: v.string(),
        allocated: v.number(),
        spent: v.number(),
      }),
    ),
    currency: v.string(),
    totalAllocated: v.number(),
  }).index("by_user", ["userId"]),

  expenses: defineTable({
    userId: v.id("users"),
    budgetId: v.optional(v.id("budgets")),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
    receiptUrl: v.optional(v.string()),
    tags: v.array(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_budget", ["budgetId"])
    .index("by_date", ["date"]),

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTS
  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  // INVESTISSEMENTS & ÉPARGNE (Finances+)
  // ─────────────────────────────────────────────────────────────────────────
  investmentAssets: defineTable({
    userId: v.id("users"),
    symbol: v.string(),
    name: v.string(),
    sector: v.string(),
    quantity: v.number(),
    buyPrice: v.number(),
    currentPrice: v.number(),
    currency: v.string(),
    changePercent: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_symbol", ["symbol"]),

  savingsGoals: defineTable({
    userId: v.id("users"),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    monthlyContribution: v.number(),
    currency: v.string(),
    color: v.optional(v.string()),
    deadline: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUS & MISSIONS
  // ─────────────────────────────────────────────────────────────────────────
  revenueStreams: defineTable({
    userId: v.id("users"),
    source: v.string(), // "freelance", "ventes", "location", "salaire", "autre"
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    frequency: v.union(
      v.literal("unique"),
      v.literal("hebdomadaire"),
      v.literal("mensuel"),
      v.literal("annuel"),
    ),
    lastReceivedAt: v.optional(v.string()),
    active: v.boolean(),
  }).index("by_user", ["userId"]),

  revenueEntries: defineTable({
    userId: v.id("users"),
    streamId: v.optional(v.id("revenueStreams")),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    date: v.string(),
    category: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  // ─────────────────────────────────────────────────────────────────────────
  // PLANIFICATEUR (tâches, objectifs, calendrier)
  // ─────────────────────────────────────────────────────────────────────────
  plannerTasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done"),
      v.literal("cancelled"),
    ),
    tags: v.array(v.string()),
    reminderAt: v.optional(v.string()),
    repeat: v.optional(
      v.union(
        v.literal("none"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
      ),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_dueDate", ["dueDate"]),

  plannerGoals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    targetDate: v.optional(v.string()),
    progressPct: v.number(),
    milestones: v.array(
      v.object({
        label: v.string(),
        done: v.boolean(),
      }),
    ),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused"),
    ),
    color: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ─────────────────────────────────────────────────────────────────────────
  // LIVE STREAMING
  // ─────────────────────────────────────────────────────────────────────────
  liveStreams: defineTable({
    hostId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    thumbnailUrl: v.optional(v.string()),
    streamUrl: v.optional(v.string()), // CDN/RTMP URL once live
    viewerCount: v.number(),
    peakViewers: v.number(),
    likeCount: v.number(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("live"),
      v.literal("ended"),
    ),
    scheduledAt: v.optional(v.string()),
    startedAt: v.optional(v.string()),
    endedAt: v.optional(v.string()),
    tags: v.array(v.string()),
    isPublic: v.boolean(),
  })
    .index("by_host", ["hostId"])
    .index("by_status", ["status"]),

  liveStreamMessages: defineTable({
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
    text: v.string(),
    type: v.union(
      v.literal("chat"),
      v.literal("super_chat"),
      v.literal("system"),
    ),
    amount: v.optional(v.number()), // for super_chat
    currency: v.optional(v.string()),
  }).index("by_stream", ["streamId"]),

  liveStreamFollows: defineTable({
    streamId: v.id("liveStreams"),
    userId: v.id("users"),
    joinedAt: v.string(),
  })
    .index("by_stream", ["streamId"])
    .index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // HÉBERGEMENT RÉSERVATIONS (enrichi)
  // ─────────────────────────────────────────────────────────────────────────
  accommodationReviews: defineTable({
    accommodationId: v.id("accommodations"),
    bookingId: v.id("accommodationBookings"),
    reviewerId: v.id("users"),
    rating: v.number(), // 1–5
    comment: v.optional(v.string()),
    categories: v.optional(
      v.object({
        proprete: v.number(),
        emplacement: v.number(),
        rapport_qualite_prix: v.number(),
        communication: v.number(),
      }),
    ),
  })
    .index("by_accommodation", ["accommodationId"])
    .index("by_reviewer", ["reviewerId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // RÉPUTATION ENRICHIE
  // ─────────────────────────────────────────────────────────────────────────
  reputationLevels: defineTable({
    userId: v.id("users"),
    totalPoints: v.number(),
    level: v.string(),
    lastUpdatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_totalPoints", ["totalPoints"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SOS & CONTACTS D'URGENCE
  // ─────────────────────────────────────────────────────────────────────────
  emergencyContacts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    relation: v.string(),
    isPrimary: v.boolean(),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SOS — ALERTES D'URGENCE
  // ─────────────────────────────────────────────────────────────────────────

  emergencyAlerts: defineTable({
    userId: v.id("users"),

    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("resolved"),
      v.literal("expired"),
    ),

    message: v.string(),

    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    accuracy: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),

    expiresAt: v.number(),

    resolvedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    expiredAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_status_expiresAt", ["status", "expiresAt"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SOS — DESTINATAIRES SNAPSHOT
  // ─────────────────────────────────────────────────────────────────────────

  emergencyAlertRecipients: defineTable({
    alertId: v.id("emergencyAlerts"),
    userId: v.id("users"),

    /**
     * Snapshot du contact au moment du SOS.
     * Une modification ultérieure du carnet de contacts
     * ne modifie donc pas l'historique.
     */
    name: v.string(),
    phone: v.string(),
    relation: v.string(),
    isPrimary: v.boolean(),

    status: v.union(
      v.literal("pending_dispatch"),
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),

    provider: v.optional(v.string()),
    providerMessageId: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),

    dispatchedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),
  })
    .index("by_alert", ["alertId"])
    .index("by_user", ["userId"])
    .index("by_alert_status", ["alertId", "status"])
    .index("by_status", ["status"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SOS — CHECK-IN DE SÉCURITÉ
  // ─────────────────────────────────────────────────────────────────────────

  safetyCheckIns: defineTable({
    userId: v.id("users"),

    status: v.union(
      v.literal("created"),
      v.literal("pending_dispatch"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
    ),

    message: v.string(),

    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    accuracy: v.optional(v.number()),

    recipientCount: v.number(),

    createdAt: v.number(),

    dispatchedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_status", ["status"]),

  // ─────────────────────────────────────────────────────────────────────────
  // AI INTERACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  aiInteractions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("chat"),
      v.literal("generate_content"),
      v.literal("analyze_image"),
      v.literal("moderate_text"),
      v.literal("suggest_tags"),
      v.literal("translate"),
      v.literal("personalize"),
    ),
    input: v.string(), // prompt or content snippet
    output: v.string(), // AI response
    model: v.string(),
    durationMs: v.optional(v.number()),
    moduleContext: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  // ─── Short Videos (Reels) ────────────────────────────────────────────────────
  shortVideos: defineTable({
    authorId: v.id("users"),
    videoUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    caption: v.string(),
    hashtags: v.array(v.string()),
    likeCount: v.number(),
    commentCount: v.number(),
    shareCount: v.number(),
    viewCount: v.number(),
    duration: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_author", ["authorId"])
    .index("by_active", ["isActive"]),

  shortVideoLikes: defineTable({
    videoId: v.id("shortVideos"),
    userId: v.id("users"),
  })
    .index("by_video", ["videoId"])
    .index("by_user_and_video", ["userId", "videoId"]),

  shortVideoComments: defineTable({
    videoId: v.id("shortVideos"),
    userId: v.id("users"),
    text: v.string(),
    likeCount: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_user", ["userId"]),

  userDocuments: defineTable({
    userId: v.id("users"),
    title: v.string(),
    category: v.union(
      v.literal("identite"),
      v.literal("contrat"),
      v.literal("facture"),
      v.literal("medical"),
      v.literal("juridique"),
      v.literal("education"),
      v.literal("autre"),
    ),
    fileUrl: v.string(), // CDN URL
    fileType: v.string(), // "pdf", "jpg"…
    fileSizeKb: v.optional(v.number()),
    tags: v.array(v.string()),
    isPrivate: v.boolean(),
    expiresAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"]),

  // ─────────────────────────────────────────────────────────────────────────
  // URBANISME & ENVIRONNEMENT
  // ─────────────────────────────────────────────────────────────────────────
  ecoProgress: defineTable({
    userId: v.id("users"),
    actionId: v.string(),
    points: v.number(),
    done: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_action", ["userId", "actionId"]),

  urbanPermits: defineTable({
    userId: v.id("users"),
    permitId: v.string(),
    type: v.string(),
    address: v.string(),
    status: v.string(),
    date: v.string(),
  }).index("by_user", ["userId"]),
  // ===========================================================================
  // URBANISME — SOURCES RÉELLES
  // ===========================================================================
  //
  // Architecture :
  //
  //   Source réelle
  //       ↓
  //   Opportunité
  //       ↓
  //   Marché / Appel d'offres
  //       ↓
  //   Qualification
  //       ↓
  //   Dossier
  //       ↓
  //   Documents
  //       ↓
  //   Soumission
  //       ↓
  //   Audit
  //
  // Aucune donnée publique ne doit être considérée comme officielle
  // sans rattachement à une source.
  // ===========================================================================

  urbanSources: defineTable({
    name: v.string(),

    type: v.union(
      v.literal("official_portal"),
      v.literal("institution"),
      v.literal("municipality"),
      v.literal("public_company"),
      v.literal("partner"),
      v.literal("manual"),
      v.literal("other"),
    ),

    organization: v.optional(v.string()),

    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),

    url: v.optional(v.string()),

    verified: v.boolean(),
    active: v.boolean(),

    lastCheckedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_active", ["active"])
    .index("by_verified", ["verified"])
    .index("by_country", ["country"]),

  // ===========================================================================
  // URBANISME — OPPORTUNITÉS
  // ===========================================================================

  urbanOpportunities: defineTable({
    sourceId: v.id("urbanSources"),

    title: v.string(),
    description: v.string(),

    category: v.union(
      v.literal("voirie"),
      v.literal("batiment"),
      v.literal("assainissement"),
      v.literal("eau"),
      v.literal("electricite"),
      v.literal("transport"),
      v.literal("amenagement"),
      v.literal("urbanisme"),
      v.literal("infrastructure"),
      v.literal("environnement"),
      v.literal("etudes"),
      v.literal("services"),
      v.literal("autre"),
    ),

    country: v.string(),
    region: v.optional(v.string()),
    city: v.optional(v.string()),

    estimatedValue: v.optional(v.number()),
    currency: v.optional(v.string()),

    sourceReference: v.string(),
    sourceUrl: v.optional(v.string()),

    discoveredAt: v.number(),
    publishedAt: v.optional(v.number()),
    deadlineAt: v.optional(v.number()),

    status: v.union(
      v.literal("new"),
      v.literal("reviewing"),
      v.literal("qualified"),
      v.literal("rejected"),
      v.literal("converted"),
      v.literal("closed"),
    ),

    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("critical"),
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_source", ["sourceId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_country", ["country"])
    .index("by_deadline", ["deadlineAt"])
    .index("by_priority", ["priority"])

    // Identifiant métier de la publication dans sa source.
    .index("by_source_reference", ["sourceId", "sourceReference"]),

  // ===========================================================================
  // MARCHÉS / APPELS D'OFFRES
  // ===========================================================================

  urbanTenders: defineTable({
    opportunityId: v.id("urbanOpportunities"),
    sourceId: v.id("urbanSources"),

    reference: v.string(),

    title: v.string(),
    description: v.string(),

    procedureType: v.union(
      v.literal("appel_offres"),
      v.literal("consultation"),
      v.literal("demande_de_prix"),
      v.literal("concours"),
      v.literal("entente_directe"),
      v.literal("autre"),
    ),

    category: v.string(),

    contractingAuthority: v.string(),

    country: v.string(),
    region: v.optional(v.string()),
    city: v.optional(v.string()),

    estimatedAmount: v.optional(v.number()),
    currency: v.optional(v.string()),

    publishedAt: v.optional(v.number()),
    clarificationDeadlineAt: v.optional(v.number()),

    /**
     * Optionnel côté ingestion :
     *
     * certaines sources publient d'abord un marché sans date limite
     * exploitable ou nécessitent une synchronisation ultérieure.
     */
    submissionDeadlineAt: v.optional(v.number()),

    openingDateAt: v.optional(v.number()),

    sourceReference: v.string(),
    sourceUrl: v.optional(v.string()),

    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("deadline_passed"),
      v.literal("under_evaluation"),
      v.literal("awarded"),
      v.literal("cancelled"),
      v.literal("unknown"),
    ),

    verifiedAt: v.optional(v.number()),
    lastSourceCheckAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_opportunity", ["opportunityId"])
    .index("by_source", ["sourceId"])
    .index("by_reference", ["reference"])

    // Recherche exacte d'un marché dans une source donnée.
    .index("by_source_reference", ["sourceId", "reference"])

    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_country", ["country"])
    .index("by_submission_deadline", ["submissionDeadlineAt"])
    .index("by_authority", ["contractingAuthority"]),

  // ===========================================================================
  // QUALIFICATION DES MARCHÉS
  // ===========================================================================

  urbanTenderQualifications: defineTable({
    tenderId: v.id("urbanTenders"),
    userId: v.id("users"),

    decision: v.union(
      v.literal("pending"),
      v.literal("eligible"),
      v.literal("not_eligible"),
      v.literal("needs_review"),
    ),

    technicalFit: v.optional(v.number()),
    financialFit: v.optional(v.number()),
    geographicFit: v.optional(v.number()),
    experienceFit: v.optional(v.number()),

    requiredExperience: v.optional(v.string()),

    /**
     * Aligné avec urban.ts :
     * le moteur de qualification stocke actuellement ces champs
     * sous forme de texte structuré.
     *
     * Si nous voulons plus tard une checklist native,
     * nous pourrons migrer vers des tableaux dans un changement
     * de modèle explicite.
     */
    requiredDocuments: v.optional(v.string()),
    missingDocuments: v.optional(v.string()),

    notes: v.optional(v.string()),

    reviewedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tender", ["tenderId"])
    .index("by_user", ["userId"])
    .index("by_tender_and_user", ["tenderId", "userId"])
    .index("by_decision", ["decision"]),

  // ===========================================================================
  // DOSSIERS DE CANDIDATURE
  // ===========================================================================

  urbanTenderDossiers: defineTable({
    tenderId: v.id("urbanTenders"),

    /**
     * Propriétaire réel du dossier.
     * Toujours défini côté serveur à partir de l'utilisateur authentifié.
     */
    ownerId: v.id("users"),

    name: v.string(),

    status: v.union(
      v.literal("draft"),
      v.literal("preparation"),
      v.literal("ready"),
      v.literal("submitted"),
      v.literal("closed"),
    ),

    responsibleUserId: v.optional(v.id("users")),

    notes: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tender", ["tenderId"])
    .index("by_owner", ["ownerId"])

    // Recherche directe d'un dossier appartenant à un utilisateur
    // pour un marché donné.
    .index("by_tender_and_owner", ["tenderId", "ownerId"])

    .index("by_responsible", ["responsibleUserId"])
    .index("by_status", ["status"]),

  // ===========================================================================
  // DOCUMENTS DES DOSSIERS
  // ===========================================================================

  urbanTenderDocuments: defineTable({
    dossierId: v.id("urbanTenderDossiers"),

    uploadedBy: v.id("users"),

    name: v.string(),

    category: v.union(
      v.literal("administratif"),
      v.literal("technique"),
      v.literal("financier"),
      v.literal("juridique"),
      v.literal("experience"),
      v.literal("certification"),
      v.literal("offre"),
      v.literal("autre"),
    ),

    /**
     * Source primaire recommandée :
     * Convex Storage.
     *
     * url reste disponible pour les documents externes
     * explicitement référencés.
     */
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),

    mimeType: v.optional(v.string()),
    sizeBytes: v.optional(v.number()),

    required: v.boolean(),

    /**
     * Important :
     * "verified" ne signifie pas que le fichier existe.
     * Il signifie qu'une vérification métier a été effectuée.
     */
    verified: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dossier", ["dossierId"])
    .index("by_uploader", ["uploadedBy"])
    .index("by_category", ["category"])
    .index("by_dossier_and_category", ["dossierId", "category"]),

  // ===========================================================================
  // SOUMISSIONS
  // ===========================================================================

  urbanTenderSubmissions: defineTable({
    tenderId: v.id("urbanTenders"),
    dossierId: v.id("urbanTenderDossiers"),
    submittedBy: v.id("users"),

    submissionReference: v.string(),

    amount: v.optional(v.number()),
    currency: v.optional(v.string()),

    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("acknowledged"),
      v.literal("under_evaluation"),
      v.literal("clarification_requested"),
      v.literal("awarded"),
      v.literal("not_selected"),
      v.literal("cancelled"),
    ),

    submittedAt: v.optional(v.number()),
    acknowledgedAt: v.optional(v.number()),

    officialReference: v.optional(v.string()),
    officialSourceUrl: v.optional(v.string()),

    notes: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tender", ["tenderId"])
    .index("by_dossier", ["dossierId"])
    .index("by_submitter", ["submittedBy"])

    /**
     * Index critique pour :
     *
     * getMyTenderSubmission(dossierId)
     *
     * et pour empêcher les doublons actifs.
     */
    .index("by_dossier_and_submitter", ["dossierId", "submittedBy"])

    .index("by_status", ["status"])
    .index("by_tender_and_status", ["tenderId", "status"]),

  // ===========================================================================
  // VEILLES UTILISATEUR
  // ===========================================================================

  urbanWatchlists: defineTable({
    userId: v.id("users"),

    name: v.string(),

    keywords: v.array(v.string()),
    categories: v.array(v.string()),

    countries: v.array(v.string()),
    regions: v.array(v.string()),
    cities: v.array(v.string()),

    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    currency: v.optional(v.string()),

    active: v.boolean(),

    notifyNewOpportunity: v.boolean(),
    notifyDeadline: v.boolean(),
    notifyStatusChange: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_active", ["userId", "active"]),

  // ===========================================================================
  // HISTORIQUE / AUDIT DU PIPELINE
  // ===========================================================================

  urbanTenderEvents: defineTable({
    tenderId: v.id("urbanTenders"),

    actorId: v.optional(v.id("users")),

    type: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("verified"),
      v.literal("qualified"),
      v.literal("rejected"),
      v.literal("dossier_created"),
      v.literal("document_added"),
      v.literal("submission_created"),
      v.literal("submitted"),
      v.literal("status_changed"),
      v.literal("deadline_changed"),
      v.literal("awarded"),
      v.literal("not_selected"),
      v.literal("note_added"),
    ),

    fromStatus: v.optional(v.string()),
    toStatus: v.optional(v.string()),

    message: v.optional(v.string()),

    metadata: v.optional(v.record(v.string(), v.string())),

    createdAt: v.number(),
  })
    .index("by_tender", ["tenderId"])
    .index("by_actor", ["actorId"])
    .index("by_type", ["type"])
    .index("by_created_at", ["createdAt"]),

  // ===========================================================================
  // HISTORIQUE / AUDIT DU PIPELINE
  // ===========================================================================

  energySettings: defineTable({
    userId: v.id("users"),
    autoSave: v.boolean(),
    solarAlerts: v.boolean(),
  }).index("by_user", ["userId"]),

  housingFavorites: defineTable({
    userId: v.id("users"),
    listingId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_listing", ["userId", "listingId"]),

  visitBookings: defineTable({
    userId: v.id("users"),
    listingId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_listing", ["userId", "listingId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // SPORT TOURNAMENTS
  // ─────────────────────────────────────────────────────────────────────────
  sportTournamentRegistrations: defineTable({
    userId: v.id("users"),
    tournamentName: v.string(),
    sport: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_tournament", ["userId", "tournamentName"]),

  // ─────────────────────────────────────────────────────────────────────────
  // ÉCOLE
  // ─────────────────────────────────────────────────────────────────────────
  schoolMessages: defineTable({
    userId: v.id("users"),
    fromName: v.string(),
    subject: v.string(),
    body: v.optional(v.string()),
    read: v.boolean(),
    sentAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["read"]),

  // ─────────────────────────────────────────────────────────────────────────
  // ÉGLISE
  // ─────────────────────────────────────────────────────────────────────────
  churchSubscriptions: defineTable({
    userId: v.id("users"),
    churchName: v.string(),
  }).index("by_user", ["userId"]),

  churchDonations: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    churchName: v.string(),
    note: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // CIVIC – JUSTICE, SÉCURITÉ, DATA PUBLIQUE, JURIDIQUE
  // ─────────────────────────────────────────────────────────────────────────
  justiceReports: defineTable({
    userId: v.id("users"),
    type: v.string(), // "Corruption", "Abus de pouvoir", etc.
    description: v.string(),
    location: v.optional(v.string()),
    status: v.union(
      v.literal("En cours"),
      v.literal("Transmis"),
      v.literal("Résolu"),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  securityIncidents: defineTable({
    userId: v.id("users"),
    type: v.string(), // "Agression", "Vol", etc.
    location: v.string(),
    status: v.union(
      v.literal("Signalé"),
      v.literal("En cours"),
      v.literal("Pris en charge"),
      v.literal("Résolu"),
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  dataAlerts: defineTable({
    userId: v.id("users"),
    datasetId: v.number(),
    datasetName: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_dataset", ["userId", "datasetId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // AGENDA
  // ─────────────────────────────────────────────────────────────────────────
  agendaEvents: defineTable({
    userId: v.id("users"),
    title: v.string(),
    date: v.string(), // YYYY-MM-DD
    time: v.string(), // HH:MM
    endTime: v.string(),
    category: v.union(
      v.literal("Personnel"),
      v.literal("Travail"),
      v.literal("Santé"),
      v.literal("Communauté"),
    ),
    color: v.string(),
    note: v.optional(v.string()),
    reminder: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  // ─────────────────────────────────────────────────────────────────────────
  // COFFRE-FORT DOCUMENTS (metadata only, no file upload)
  // ─────────────────────────────────────────────────────────────────────────
  vaultDocuments: defineTable({
    userId: v.id("users"),
    name: v.string(),
    category: v.union(
      v.literal("Identité"),
      v.literal("Santé"),
      v.literal("Finances"),
      v.literal("Emploi"),
      v.literal("Autres"),
    ),
    reference: v.optional(v.string()),
    expiry: v.optional(v.string()), // YYYY-MM-DD or ""
    note: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"]),

  // ─────────────────────────────────────────────────────────────────────────
  // TRACKING
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // CREATOR CHALLENGES
  // ─────────────────────────────────────────────────────────────────────────
  creatorChallenges: defineTable({
    title: v.string(),
    description: v.string(),
    hashtag: v.string(),
    category: v.string(),
    prize: v.string(),
    endDate: v.string(),
    participantCount: v.number(),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    thumbnailUrl: v.optional(v.string()),
  }).index("by_active", ["isActive"]),

  challengeParticipations: defineTable({
    challengeId: v.id("creatorChallenges"),
    userId: v.id("users"),
    videoId: v.optional(v.id("shortVideos")),
    submittedAt: v.string(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"]),

  // Creator earnings (from gifts, boosts, super chats)
  creatorEarnings: defineTable({
    creatorId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    type: v.union(
      v.literal("gift"),
      v.literal("boost"),
      v.literal("super_chat"),
      v.literal("tip"),
    ),
    sourceId: v.optional(v.string()), // stream or pub id
    sourceType: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_creator", ["creatorId"]),

  trackingItems: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("colis"),
      v.literal("vehicule"),
      v.literal("appareil"),
      v.literal("autre"),
    ),
    trackingId: v.string(), // numéro de suivi / identifiant
    status: v.string(), // e.g. "En transit", "Livré"
    location: v.optional(v.string()),
    progress: v.number(), // 0-100
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // ABONNEMENTS (PREMIUM)
  // ─────────────────────────────────────────────────────────────────────────
  userSubscriptions: defineTable({
    userId: v.id("users"),
    planId: v.union(
      v.literal("gratuit"),
      v.literal("pro"),
      v.literal("business"),
    ),
    billingCycle: v.union(v.literal("mensuel"), v.literal("annuel")),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired"),
    ),
    startedAt: v.string(),
    renewsAt: v.optional(v.string()),
    cancelledAt: v.optional(v.string()),
    autoRenew: v.boolean(),
    paymentMethod: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ─── Co-creation / Défis ──────────────────────────────────────────────────
  coCreationChallenges: defineTable({
    authorId: v.id("users"),
    titre: v.string(),
    description: v.string(),
    categorie: v.string(),
    emoji: v.string(),
    couleur: v.string(),
    rewardPoints: v.number(),
    deadline: v.string(),
    status: v.union(
      v.literal("actif"),
      v.literal("vote"),
      v.literal("terminé"),
    ),
    participantCount: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_status", ["status"]),

  coCreationEntries: defineTable({
    challengeId: v.id("coCreationChallenges"),
    authorId: v.id("users"),
    content: v.string(),
    votes: v.number(),
    winner: v.optional(v.boolean()),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_author", ["authorId"]),

  coCreationVotes: defineTable({
    entryId: v.id("coCreationEntries"),
    userId: v.id("users"),
  })
    .index("by_entry", ["entryId"])
    .index("by_user", ["userId"]),

  // ─── Service Providers ─────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // SERVICES
  // ─────────────────────────────────────────────────────────────────────────
  serviceProviders: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    category: v.string(),
    specialty: v.string(),
    location: v.string(),
    description: v.string(),
    price: v.string(),
    currency: v.optional(v.string()),
    responseTime: v.string(),
    imageUrl: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    rating: v.number(),
    reviewCount: v.number(),
    skills: v.array(v.string()),
    verified: v.boolean(),
    available: v.boolean(),
    urgent: v.optional(v.boolean()),
    languages: v.optional(v.array(v.string())),
    experience: v.optional(v.string()),
    certificates: v.optional(v.array(v.string())),
    portfolio: v.optional(v.array(v.string())),
    updatedAt: v.optional(v.number()),
    insurance: v.optional(v.boolean()),
    warranty: v.optional(v.boolean()),
    online: v.optional(v.boolean()),
    lastActive: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    viewCount: v.optional(v.number()),
  })
    .index("by_category", ["category"])
    .index("by_available", ["available"]),

  serviceReviews: defineTable({
    providerId: v.id("serviceProviders"),
    reviewerId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
    createdAt: v.number(),
  }).index("by_provider", ["providerId"]),

  serviceQuestions: defineTable({
    providerId: v.id("serviceProviders"),
    askerId: v.id("users"),
    question: v.string(),
    answer: v.optional(v.string()),
    answererId: v.optional(v.id("users")),
    answeredAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_provider", ["providerId"]),

  serviceQuotes: defineTable({
    providerId: v.id("serviceProviders"),
    clientId: v.id("users"),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
  }).index("by_provider", ["providerId"]),

  serviceFavorites: defineTable({
    providerId: v.id("serviceProviders"),
    userId: v.id("users"),
    createdAt: v.number(),
  }).index("by_user_and_provider", ["userId", "providerId"]),

  serviceAvailability: defineTable({
    providerId: v.id("serviceProviders"),
    date: v.string(),
    slots: v.array(v.object({ start: v.string(), end: v.string() })),
  }).index("by_provider", ["providerId"]),

  serviceHistory: defineTable({
    providerId: v.id("serviceProviders"),
    event: v.string(),
    createdAt: v.number(),
  }).index("by_provider", ["providerId"]),

  serviceBookings: defineTable({
    providerId: v.id("serviceProviders"),
    userId: v.id("users"),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("done"),
      v.literal("cancelled"),
    ),
    scheduledAt: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_provider", ["providerId"])
    .index("by_user", ["userId"]),

  // ===========================================================================
  // VOYAGES — TRANSPORT INTER-VILLES
  // ===========================================================================

  trips: defineTable({
    // -------------------------------------------------------------------------
    // Opérateur
    // -------------------------------------------------------------------------
    operator: v.string(),
    operatorLogo: v.optional(v.string()),

    // -------------------------------------------------------------------------
    // Transport
    // -------------------------------------------------------------------------
    type: v.union(v.literal("Bus"), v.literal("Minibus"), v.literal("Avion")),

    // -------------------------------------------------------------------------
    // Itinéraire
    // -------------------------------------------------------------------------
    from: v.string(),
    to: v.string(),

    // -------------------------------------------------------------------------
    // Horaires
    // -------------------------------------------------------------------------
    departure: v.string(),
    arrival: v.string(),

    // Date canonique du départ.
    // Format recommandé : YYYY-MM-DD
    departureDate: v.string(),

    // -------------------------------------------------------------------------
    // Durée / tarification
    // -------------------------------------------------------------------------
    durationMinutes: v.number(),
    price: v.number(),
    currency: v.string(),

    // -------------------------------------------------------------------------
    // Capacité
    // -------------------------------------------------------------------------
    availableSeats: v.number(),
    totalSeats: v.number(),

    // -------------------------------------------------------------------------
    // Présentation
    // -------------------------------------------------------------------------
    amenities: v.array(v.string()),
    rating: v.number(),
    reviewCount: v.number(),

    imageUrl: v.optional(v.string()),
    color: v.optional(v.string()),
  })
    // Recherche classique par route.
    .index("by_route", ["from", "to"])

    // Recherche directe par date.
    .index("by_date", ["departureDate"])

    // Recherche production :
    // route + date sans devoir charger toutes les dates de cette route.
    .index("by_route_and_date", ["from", "to", "departureDate"]),

  // ===========================================================================
  // RÉSERVATIONS
  // ===========================================================================

  tripBookings: defineTable({
    tripId: v.id("trips"),
    userId: v.id("users"),

    // Nombre de places achetées.
    seats: v.number(),

    // Montant calculé côté serveur.
    totalPrice: v.number(),

    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
    ),

    // Numéros de sièges affichés dans le billet.
    seatNumbers: v.array(v.string()),

    passengerName: v.string(),
    passengerPhone: v.optional(v.string()),

    bookedAt: v.string(),
  })
    .index("by_trip", ["tripId"])
    .index("by_user", ["userId"])

    // Utile pour contrôler rapidement les réservations actives
    // d'un trajet.
    .index("by_trip_and_status", ["tripId", "status"])

    // Empêche la création de plusieurs réservations
    // pour le même utilisateur et le même trajet lorsque
    // cette contrainte est contrôlée côté mutation.
    .index("by_user_and_trip", ["userId", "tripId"]),

  // ===========================================================================
  // SIÈGES — SOURCE DE VÉRITÉ
  // ===========================================================================

  /*
   * Un siège = un document.
   *
   * C'est volontairement séparé de tripBookings.seatNumbers.
   * Un tableau dans tripBookings permet d'afficher les sièges,
   * mais ne constitue pas une source de vérité suffisamment robuste
   * pour gérer les conflits de réservation siège par siège.
   */
  tripSeats: defineTable({
    tripId: v.id("trips"),

    // Identifiant métier du siège :
    // "1A", "1B", "12A", "12B", etc.
    seatNumber: v.string(),

    status: v.union(
      v.literal("available"),
      v.literal("held"),
      v.literal("booked"),
      v.literal("blocked"),
    ),

    // Réservation actuellement associée au siège.
    bookingId: v.optional(v.id("tripBookings")),

    // Utilisateur ayant temporairement ou définitivement
    // réservé le siège.
    userId: v.optional(v.id("users")),

    // Permet de gérer les réservations temporaires.
    heldUntil: v.optional(v.number()),

    updatedAt: v.number(),
  })
    .index("by_trip", ["tripId"])

    // Recherche exacte d'un siège dans un trajet.
    .index("by_trip_and_seat", ["tripId", "seatNumber"])

    .index("by_trip_and_status", ["tripId", "status"])

    .index("by_booking", ["bookingId"])

    .index("by_user", ["userId"]),

  // ===========================================================================
  // FAVORIS TRAJETS
  // ===========================================================================

  tripSaves: defineTable({
    userId: v.id("users"),
    tripId: v.id("trips"),
    savedAt: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_trip", ["tripId"])
    .index("by_user_and_trip", ["userId", "tripId"]),

  // ===========================================================================
  // AVIS VOYAGEURS
  // ===========================================================================

  tripReviews: defineTable({
    tripId: v.id("trips"),
    reviewerId: v.id("users"),

    authorName: v.string(),

    rating: v.number(),
    comment: v.string(),

    // Permet de démontrer que l'avis provient
    // d'une réservation réelle.
    bookingId: v.id("tripBookings"),

    createdAt: v.string(),
  })
    .index("by_trip", ["tripId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_booking", ["bookingId"])

    // Permet les lectures/tri par note.
    .index("by_trip_and_rating", ["tripId", "rating"]),

  // ===========================================================================
  // DESTINATIONS
  // ===========================================================================

  destinations: defineTable({
    name: v.string(),
    country: v.string(),
    continent: v.string(),

    imageUrl: v.optional(v.string()),

    budget: v.string(),
    rating: v.number(),
    reviewCount: v.number(),

    description: v.string(),
    highlights: v.array(v.string()),

    trending: v.boolean(),

    color: v.string(),
    currency: v.string(),
    language: v.string(),

    flightHours: v.number(),
  })
    .index("by_continent", ["continent"])

    // Utile pour les destinations mises en avant.
    .index("by_trending", ["trending"]),

  // ===========================================================================
  // FAVORIS DESTINATIONS
  // ===========================================================================

  destinationSaves: defineTable({
    userId: v.id("users"),
    destinationId: v.id("destinations"),
  })
    .index("by_user", ["userId"])
    .index("by_destination", ["destinationId"])
    .index("by_user_and_destination", ["userId", "destinationId"]),

  // ─── User Settings ──────────────────────────────────────────────────────────
  userSettings: defineTable({
    userId: v.id("users"),
    notifications: v.optional(v.boolean()),
    offlineMode: v.optional(v.boolean()),
    biometrics: v.optional(v.boolean()),
    jobAlerts: v.optional(v.boolean()),
    immoAlerts: v.optional(v.boolean()),
    paymentAlerts: v.optional(v.boolean()),
    language: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // ─── Juridique / Contracts ──────────────────────────────────────────────────
  legalRequests: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_review"),
      v.literal("resolved"),
    ),
    response: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ── AI Personalization Preferences ─────────────────────────────────────────
  aiPreferences: defineTable({
    userId: v.id("users"),
    interests: v.array(v.string()),
    city: v.optional(v.string()),
    language: v.optional(v.string()),
    recommendedModules: v.optional(v.array(v.string())),
    recommendedTags: v.optional(v.array(v.string())),
    welcomeMessage: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // ÉDITEUR – BROUILLONS CLOUD
  // ─────────────────────────────────────────────────────────────────────────
  contentDrafts: defineTable({
    userId: v.id("users"),
    title: v.string(),
    html: v.string(),
    savedAt: v.string(), // ISO 8601
  }).index("by_user", ["userId"]),
  drafts: defineTable({
    userId: v.id("users"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    meta: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    videos: v.optional(v.array(v.string())),
    audio: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    location: v.optional(v.string()),
    scheduleDate: v.optional(v.string()),
    audience: v.optional(
      v.union(v.literal("public"), v.literal("friends"), v.literal("private")),
    ),
    mood: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),
  // ─────────────────────────────────────────────────────────────────────────
  // SÉRIES & PLAYLISTS
  // ─────────────────────────────────────────────────────────────────────────
  series: defineTable({
    creatorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    coverImage: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    episodeCount: v.number(), // denormalized
    subscriberCount: v.number(), // denormalized
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("draft"),
    ),
  })
    .index("by_creator", ["creatorId"])
    .index("by_status", ["status"])
    .searchIndex("search_series", {
      searchField: "title",
      filterFields: ["status"],
    }),

  seriesEpisodes: defineTable({
    seriesId: v.id("series"),
    publicationId: v.id("publications"), // link to the actual content
    episodeNumber: v.number(),
    title: v.string(),
  })
    .index("by_series", ["seriesId"])
    .index("by_series_and_order", ["seriesId", "episodeNumber"]),

  seriesSubscriptions: defineTable({
    seriesId: v.id("series"),
    userId: v.id("users"),
  })
    .index("by_series", ["seriesId"])
    .index("by_user", ["userId"])
    .index("by_user_and_series", ["userId", "seriesId"]),

  seriesProgress: defineTable({
    seriesId: v.id("series"),
    userId: v.id("users"),
    lastEpisodeNumber: v.number(),
    completedEpisodes: v.array(v.number()),
  }).index("by_user_and_series", ["userId", "seriesId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // DÉFIS CRÉATEURS & TENDANCES
  // ─────────────────────────────────────────────────────────────────────────
  challenges: defineTable({
    creatorId: v.id("users"), // null-like = platform challenge (use system user)
    title: v.string(),
    description: v.string(),
    coverImage: v.optional(v.string()),
    hashtag: v.string(), // e.g. "#DefiAgri1"
    category: v.string(),
    xpReward: v.number(),
    participantCount: v.number(), // denormalized
    startsAt: v.string(), // ISO 8601
    endsAt: v.string(),
    status: v.union(
      v.literal("upcoming"),
      v.literal("active"),
      v.literal("ended"),
    ),
    isOfficial: v.boolean(), // platform-created vs user-created
    winnerId: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_creator", ["creatorId"])
    .index("by_hashtag", ["hashtag"]),

  challengeEntries: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    publicationId: v.optional(v.id("publications")), // submission
    voteCount: v.number(),
    joinedAt: v.string(),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"])
    .index("by_challenge_and_user", ["challengeId", "userId"])
    .index("by_challenge_and_votes", ["challengeId", "voteCount"]),

  challengeEntryVotes: defineTable({
    challengeId: v.id("challenges"),
    entryId: v.id("challengeEntries"),
    voterId: v.id("users"),
  })
    .index("by_entry", ["entryId"])
    .index("by_voter_and_challenge", ["voterId", "challengeId"]),

  trendingHashtags: defineTable({
    hashtag: v.string(),
    count: v.number(), // publication count using this hashtag
    weekStart: v.string(), // ISO date "YYYY-MM-DD" of week start
  })
    .index("by_hashtag_and_week", ["hashtag", "weekStart"])
    .index("by_week_and_count", ["weekStart", "count"]),
  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGERIE AVANCÉE (V1.1+)
  // ─────────────────────────────────────────────────────────────────────────

  // Messages épinglés (dans une conversation)
  conversationPins: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    pinnedAt: v.string(),
  }).index("by_user", ["userId"]),

  // Accusés de lecture
  readReceipts: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    readAt: v.string(),
  })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_message_user", ["messageId", "userId"]),

  // Présence en ligne
  presence: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("online"),
      v.literal("away"),
      v.literal("offline"),
    ),
    lastSeen: v.string(),
    device: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Pièces jointes aux messages
  attachments: defineTable({
    messageId: v.id("messages"),
    fileId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    duration: v.optional(v.number()),
    createdAt: v.string(),
  }).index("by_message", ["messageId"]),

  // ─────────────────────────────────────────────────────────────────────────
  // MESSAGERIE — SONDAGES
  // ─────────────────────────────────────────────────────────────────────────

  polls: defineTable({
    conversationId: v.id("conversations"),
    creatorId: v.id("users"),

    question: v.string(),

    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      }),
    ),

    multipleChoice: v.boolean(),
    anonymous: v.boolean(),

    expiresAt: v.optional(v.string()),

    messageId: v.optional(v.id("messages")),

    closed: v.boolean(),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_creator", ["creatorId"])
    .index("by_message", ["messageId"])
    .index("by_createdAt", ["createdAt"]),

  pollVotes: defineTable({
    pollId: v.id("polls"),
    userId: v.id("users"),
    optionId: v.string(),
    createdAt: v.string(),
  })
    .index("by_poll", ["pollId"])
    .index("by_user", ["userId"])
    .index("by_poll_and_user", ["pollId", "userId"])
    .index("by_poll_and_option", ["pollId", "optionId"]),

  messageLocations: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),

    latitude: v.number(),
    longitude: v.number(),

    accuracy: v.optional(v.number()),
    altitude: v.optional(v.number()),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),

    address: v.optional(v.string()),
    placeName: v.optional(v.string()),

    messageId: v.optional(v.id("messages")),

    isLive: v.boolean(),
    expiresAt: v.optional(v.string()),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_conversation_and_user", ["conversationId", "userId"])
    .index("by_message", ["messageId"]),

  // Appels audio/vidéo
  calls: defineTable({
    conversationId: v.id("conversations"),
    initiatedBy: v.id("users"),
    type: v.union(v.literal("audio"), v.literal("video")),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("ended"),
      v.literal("missed"),
    ),
    startedAt: v.string(),
    endedAt: v.optional(v.string()),
  }).index("by_conversation", ["conversationId"]),

  // Clés de chiffrement des utilisateurs
  userKeys: defineTable({
    userId: v.id("users"),
    publicKey: v.string(),
    privateKey: v.string(),
    createdAt: v.string(),
  }).index("by_user", ["userId"]),
});
