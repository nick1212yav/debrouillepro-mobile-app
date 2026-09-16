// convex/health.ts

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  return user;
}

async function requireAdmin(ctx: MutationCtx) {
  const user = await requireUser(ctx);
  if (!user.roles?.includes("admin")) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Accès administrateur requis",
    });
  }
  return user;
}

async function requireMedicalProfessional(
  ctx: MutationCtx,
  professionalId: Id<"medicalProfessionals">,
) {
  const user = await requireUser(ctx);
  const professional = await ctx.db.get(professionalId);

  if (!professional) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Professionnel de santé introuvable",
    });
  }

  const isAdmin = user.roles?.includes("admin") === true;
  const ownerId = ctx.db.normalizeId("users", professional.userId);

  let isOwner = ownerId === user._id;

  if (!isOwner) {
    const ownerByUid = await ctx.db
      .query("users")
      .withIndex("by_uid", (q) => q.eq("uid", professional.userId))
      .unique();

    isOwner = ownerByUid?._id === user._id;
  }

  if (!isAdmin && !isOwner) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas autorisé à effectuer cette action",
    });
  }

  return { user, professional, isAdmin };
}

async function isProfessionalOwner(
  ctx: QueryCtx | MutationCtx,
  professionalUserId: string,
  user: Awaited<ReturnType<typeof requireUser>>,
): Promise<boolean> {
  if (professionalUserId === user.uid) return true;

  const ownerId = ctx.db.normalizeId("users", professionalUserId);
  if (ownerId === user._id) return true;
  if (ownerId) return false;

  const ownerByUid = await ctx.db
    .query("users")
    .withIndex("by_uid", (q) => q.eq("uid", professionalUserId))
    .unique();

  return ownerByUid?._id === user._id;
}

function assertPositiveLimit(limit: number | undefined, fallback: number) {
  if (limit === undefined) return fallback;

  if (!Number.isFinite(limit) || limit <= 0) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: "La limite doit être un nombre positif",
    });
  }

  return Math.min(Math.floor(limit), 100);
}

function assertValidCoordinates(lat: number, lng: number) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: "Coordonnées géographiques invalides",
    });
  }
}

function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function resolveProfessionalId(
  ctx: QueryCtx,
  inputId: string,
): Promise<Id<"medicalProfessionals"> | null> {
  const professionalId = ctx.db.normalizeId("medicalProfessionals", inputId);

  if (professionalId) {
    const professional = await ctx.db.get(professionalId);
    return professional ? professional._id : null;
  }

  const userId = ctx.db.normalizeId("users", inputId);

  if (userId) {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    const professionals = await ctx.db.query("medicalProfessionals").collect();

    const match = professionals.find(
      (professional) =>
        professional.userId === user.uid ||
        ctx.db.normalizeId("users", professional.userId) === user._id,
    );

    return match?._id ?? null;
  }

  const userByUid = await ctx.db
    .query("users")
    .withIndex("by_uid", (q) => q.eq("uid", inputId))
    .unique();

  if (userByUid) {
    const professionals = await ctx.db.query("medicalProfessionals").collect();

    const match = professionals.find(
      (professional) =>
        professional.userId === userByUid.uid ||
        ctx.db.normalizeId("users", professional.userId) === userByUid._id,
    );

    return match?._id ?? null;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MEDICAL PROFESSIONALS
// ─────────────────────────────────────────────────────────────────────────────

export const listProfessionals = query({
  args: {
    specialty: v.optional(v.string()),
    city: v.optional(v.string()),
    online: v.optional(v.boolean()),
    available: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let professionals = await ctx.db.query("medicalProfessionals").collect();
    const limit = assertPositiveLimit(args.limit, 50);

    if (args.specialty) {
      professionals = professionals.filter(
        (p) => p.specialty === args.specialty,
      );
    }

    if (args.city) {
      professionals = professionals.filter((p) => p.city === args.city);
    }

    if (args.online !== undefined) {
      professionals = professionals.filter((p) => p.online === args.online);
    }

    if (args.available !== undefined) {
      professionals = professionals.filter(
        (p) => p.available === args.available,
      );
    }

    if (args.minRating !== undefined) {
      professionals = professionals.filter((p) => p.rating >= args.minRating!);
    }

    if (args.search?.trim()) {
      const search = args.search.trim().toLowerCase();
      professionals = professionals.filter((p) => {
        const name = p.name?.toLowerCase() ?? "";
        const specialty = p.specialty?.toLowerCase() ?? "";
        const city = p.city?.toLowerCase() ?? "";
        return (
          name.includes(search) ||
          specialty.includes(search) ||
          city.includes(search)
        );
      });
    }

    professionals.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return professionals.slice(0, limit);
  },
});

export const getProfessional = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const resolvedId = await resolveProfessionalId(ctx, args.id);
    if (!resolvedId) return null;
    return ctx.db.get(resolvedId);
  },
});

export const createProfessional = mutation({
  args: {
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
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.fees < 0) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Les honoraires ne peuvent pas être négatifs",
      });
    }

    if (args.experience < 0) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "L'expérience ne peut pas être négative",
      });
    }

    const rating = args.rating ?? 0;
    if (rating < 0 || rating > 5) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    return ctx.db.insert("medicalProfessionals", {
      ...args,
      rating,
      reviewCount: 0,
      patients: 0,
      appointments: 0,
      isLiked: false,
      isFollowing: false,
      isLive: false,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateProfessional = mutation({
  args: {
    id: v.id("medicalProfessionals"),
    name: v.optional(v.string()),
    specialty: v.optional(v.string()),
    fees: v.optional(v.number()),
    currency: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    experience: v.optional(v.number()),
    education: v.optional(
      v.array(
        v.object({
          id: v.string(),
          institution: v.string(),
          degree: v.string(),
          year: v.optional(v.string()),
        }),
      ),
    ),
    specialities: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
    certificates: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          issuer: v.string(),
          year: v.optional(v.string()),
        }),
      ),
    ),
    awards: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          year: v.string(),
          organization: v.optional(v.string()),
        }),
      ),
    ),
    insurances: v.optional(v.array(v.string())),
    schedule: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    badges: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          icon: v.string(),
          color: v.optional(v.string()),
        }),
      ),
    ),
    online: v.optional(v.boolean()),
    verified: v.optional(v.boolean()),
    available: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("pending"),
        v.literal("suspended"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.fees !== undefined && args.fees < 0) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Les honoraires ne peuvent pas être négatifs",
      });
    }

    if (args.experience !== undefined && args.experience < 0) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "L'expérience ne peut pas être négative",
      });
    }

    if (args.rating !== undefined && (args.rating < 0 || args.rating > 5)) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const deleteProfessional = mutation({
  args: { id: v.id("medicalProfessionals") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const professional = await ctx.db.get(args.id);
    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel de santé introuvable",
      });
    }

    await ctx.db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. HOSPITALS
// ─────────────────────────────────────────────────────────────────────────────

export const listHospitals = query({
  args: {
    city: v.optional(v.string()),
    emergency: v.optional(v.boolean()),
    specialty: v.optional(v.string()),
    minRating: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let hospitals = await ctx.db.query("hospitals").collect();
    const limit = assertPositiveLimit(args.limit, 50);

    if (args.city) {
      hospitals = hospitals.filter((h) => h.city === args.city);
    }

    if (args.emergency !== undefined) {
      hospitals = hospitals.filter((h) => h.emergency === args.emergency);
    }

    if (args.specialty) {
      hospitals = hospitals.filter((h) =>
        h.services?.includes(args.specialty!),
      );
    }

    if (args.minRating !== undefined) {
      hospitals = hospitals.filter((h) => h.rating >= args.minRating!);
    }

    if (args.search?.trim()) {
      const search = args.search.trim().toLowerCase();
      hospitals = hospitals.filter((h) =>
        h.name.toLowerCase().includes(search),
      );
    }

    hospitals.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return hospitals.slice(0, limit);
  },
});

export const getHospital = query({
  args: { id: v.id("hospitals") },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.id);
    if (!hospital) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hôpital introuvable",
      });
    }
    return hospital;
  },
});

export const createHospital = mutation({
  args: {
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
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    const rating = args.rating ?? 0;
    if (rating < 0 || rating > 5) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    return ctx.db.insert("hospitals", {
      ...args,
      rating,
      reviewCount: 0,
      occupiedBeds: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateHospital = mutation({
  args: {
    id: v.id("hospitals"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    hours: v.optional(v.string()),
    open: v.optional(v.boolean()),
    priceRange: v.optional(v.string()),
    beds: v.optional(v.number()),
    doctors: v.optional(v.number()),
    specialties: v.optional(v.number()),
    description: v.optional(v.string()),
    services: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    emergency: v.optional(v.boolean()),
    parking: v.optional(v.boolean()),
    pharmacy: v.optional(v.boolean()),
    cafeteria: v.optional(v.boolean()),
    wifi: v.optional(v.boolean()),
    ambulance: v.optional(v.boolean()),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    if (args.rating !== undefined && (args.rating < 0 || args.rating > 5)) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const getHospitalServices = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital) return [];
    return hospital.services ?? [];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PHARMACIES
// ─────────────────────────────────────────────────────────────────────────────

export const listPharmacies = query({
  args: {
    city: v.optional(v.string()),
    openNow: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    services: v.optional(v.array(v.string())),
    delivery: v.optional(v.boolean()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let pharmacies = await ctx.db.query("pharmacies").collect();
    const limit = assertPositiveLimit(args.limit, 50);

    if (args.city) {
      pharmacies = pharmacies.filter((p) => p.city === args.city);
    }

    if (args.openNow !== undefined) {
      pharmacies = pharmacies.filter((p) => p.open === args.openNow);
    }

    if (args.minRating !== undefined) {
      pharmacies = pharmacies.filter((p) => p.rating >= args.minRating!);
    }

    if (args.services?.length) {
      pharmacies = pharmacies.filter((p) =>
        args.services!.every((service) => p.services?.includes(service)),
      );
    }

    if (args.delivery !== undefined) {
      pharmacies = pharmacies.filter((p) => p.delivery === args.delivery);
    }

    if (args.search?.trim()) {
      const search = args.search.trim().toLowerCase();
      pharmacies = pharmacies.filter((p) =>
        p.name.toLowerCase().includes(search),
      );
    }

    pharmacies.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return pharmacies.slice(0, limit);
  },
});

export const getPharmacy = query({
  args: { id: v.id("pharmacies") },
  handler: async (ctx, args) => {
    const pharmacy = await ctx.db.get(args.id);
    if (!pharmacy) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pharmacie introuvable",
      });
    }
    return pharmacy;
  },
});

export const createPharmacy = mutation({
  args: {
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
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    const rating = args.rating ?? 0;
    if (rating < 0 || rating > 5) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    return ctx.db.insert("pharmacies", {
      ...args,
      rating,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updatePharmacy = mutation({
  args: {
    id: v.id("pharmacies"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    hours: v.optional(v.string()),
    open: v.optional(v.boolean()),
    services: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    delivery: v.optional(v.boolean()),
    deliveryRadius: v.optional(v.number()),
    deliveryFee: v.optional(v.number()),
    onlineOrders: v.optional(v.boolean()),
    acceptsInsurance: v.optional(v.boolean()),
    insurances: v.optional(v.array(v.string())),
    products: v.optional(
      v.array(
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
    ),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    if (args.rating !== undefined && (args.rating < 0 || args.rating > 5)) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. LABORATORIES
// ─────────────────────────────────────────────────────────────────────────────

export const listLaboratories = query({
  args: {
    city: v.optional(v.string()),
    openNow: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let laboratories = await ctx.db.query("laboratories").collect();
    const limit = assertPositiveLimit(args.limit, 50);

    if (args.city) {
      laboratories = laboratories.filter((l) => l.city === args.city);
    }

    if (args.openNow !== undefined) {
      laboratories = laboratories.filter((l) => l.open === args.openNow);
    }

    if (args.minRating !== undefined) {
      laboratories = laboratories.filter((l) => l.rating >= args.minRating!);
    }

    if (args.search?.trim()) {
      const search = args.search.trim().toLowerCase();
      laboratories = laboratories.filter((l) =>
        l.name.toLowerCase().includes(search),
      );
    }

    laboratories.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return laboratories.slice(0, limit);
  },
});

export const getLaboratory = query({
  args: { id: v.id("laboratories") },
  handler: async (ctx, args) => {
    const laboratory = await ctx.db.get(args.id);
    if (!laboratory) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Laboratoire introuvable",
      });
    }
    return laboratory;
  },
});

export const createLaboratory = mutation({
  args: {
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
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    const rating = args.rating ?? 0;
    if (rating < 0 || rating > 5) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La note doit être comprise entre 0 et 5",
      });
    }

    return ctx.db.insert("laboratories", {
      ...args,
      rating,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateLaboratory = mutation({
  args: {
    id: v.id("laboratories"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    hours: v.optional(v.string()),
    open: v.optional(v.boolean()),
    tests: v.optional(v.number()),
    equipment: v.optional(v.number()),
    testsList: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CLINICS
// ─────────────────────────────────────────────────────────────────────────────

export const listClinics = query({
  args: {
    city: v.optional(v.string()),
    emergency: v.optional(v.boolean()),
    specialty: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let clinics = await ctx.db.query("clinics").collect();
    const limit = assertPositiveLimit(args.limit, 50);

    if (args.city) {
      clinics = clinics.filter((c) => c.city === args.city);
    }

    if (args.emergency !== undefined) {
      clinics = clinics.filter((c) => c.emergency === args.emergency);
    }

    if (args.specialty) {
      clinics = clinics.filter((c) => c.specialties?.includes(args.specialty!));
    }

    if (args.search?.trim()) {
      const search = args.search.trim().toLowerCase();
      clinics = clinics.filter((c) => c.name.toLowerCase().includes(search));
    }

    return clinics.slice(0, limit);
  },
});

export const getClinic = query({
  args: { id: v.id("clinics") },
  handler: async (ctx, args) => {
    const clinic = await ctx.db.get(args.id);
    if (!clinic) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Clinique introuvable",
      });
    }
    return clinic;
  },
});

export const createClinic = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    return ctx.db.insert("clinics", {
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateClinic = mutation({
  args: {
    id: v.id("clinics"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    hours: v.optional(v.string()),
    open: v.optional(v.boolean()),
    specialties: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    emergency: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. AMBULANCES
// ─────────────────────────────────────────────────────────────────────────────

export const listAmbulances = query({
  args: {
    city: v.optional(v.string()),
    available: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let ambulances = await ctx.db.query("ambulances").collect();
    const limit = assertPositiveLimit(args.limit, 50);

    if (args.city) {
      ambulances = ambulances.filter((a) => a.city === args.city);
    }

    if (args.available !== undefined) {
      ambulances = ambulances.filter((a) => a.available === args.available);
    }

    return ambulances.slice(0, limit);
  },
});

export const getAmbulance = query({
  args: { id: v.id("ambulances") },
  handler: async (ctx, args) => {
    const ambulance = await ctx.db.get(args.id);
    if (!ambulance) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Service ambulancier introuvable",
      });
    }
    return ambulance;
  },
});

export const createAmbulance = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    return ctx.db.insert("ambulances", {
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateAmbulance = mutation({
  args: {
    id: v.id("ambulances"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    hours: v.optional(v.string()),
    available: v.optional(v.boolean()),
    vehicles: v.optional(v.number()),
    paramedics: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.latitude !== undefined && args.longitude !== undefined) {
      assertValidCoordinates(args.latitude, args.longitude);
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. AVAILABILITY & BOOKING
// ─────────────────────────────────────────────────────────────────────────────

function assertDateOnly(value: string): string {
  const date = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: "La date doit être au format YYYY-MM-DD",
    });
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: "Date invalide",
    });
  }

  if (parsed.toISOString().slice(0, 10) !== date) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: "Date invalide",
    });
  }

  return date;
}

function assertTime(value: string, fieldName: string): string {
  const time = value.trim();

  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: `${fieldName} doit être au format HH:mm`,
    });
  }

  return time;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function assertValidSlot(start: string, end: string) {
  const normalizedStart = assertTime(start, "L'heure de début");
  const normalizedEnd = assertTime(end, "L'heure de fin");

  if (timeToMinutes(normalizedEnd) <= timeToMinutes(normalizedStart)) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: "L'heure de fin doit être après l'heure de début",
    });
  }

  return { start: normalizedStart, end: normalizedEnd };
}

function slotsOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
): boolean {
  const firstStartMinutes = timeToMinutes(firstStart);
  const firstEndMinutes = timeToMinutes(firstEnd);
  const secondStartMinutes = timeToMinutes(secondStart);
  const secondEndMinutes = timeToMinutes(secondEnd);

  return (
    firstStartMinutes < secondEndMinutes && secondStartMinutes < firstEndMinutes
  );
}

export const getAvailability = query({
  args: {
    professionalId: v.string(),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const professionalId = await resolveProfessionalId(
      ctx,
      args.professionalId,
    );

    if (!professionalId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel de santé introuvable",
      });
    }

    const professional = await ctx.db.get(professionalId);

    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel de santé introuvable",
      });
    }

    const date = assertDateOnly(
      args.date ?? new Date().toISOString().slice(0, 10),
    );

    const availability = await ctx.db
      .query("medicalAvailability")
      .withIndex("by_professional_date", (q) =>
        q.eq("professionalId", professionalId).eq("date", date),
      )
      .unique();

    if (!availability) {
      return {
        professionalId,
        date,
        configured: false,
        available: false,
        slots: [],
      };
    }

    if (professional.status !== "active" || professional.available !== true) {
      return {
        professionalId,
        date,
        configured: true,
        available: false,
        slots: [],
      };
    }

    const appointments = await ctx.db
      .query("medicalAppointments")
      .withIndex("by_professional_date", (q) =>
        q.eq("professionalId", professionalId).eq("date", date),
      )
      .collect();

    const bookedAppointments = appointments.filter(
      (a) => a.status === "scheduled",
    );

    const slots = availability.slots.map((slot) => {
      const normalized = assertValidSlot(slot.start, slot.end);

      const booked = bookedAppointments.some((appointment) => {
        if (!appointment.slotStart || !appointment.slotEnd) return false;
        return slotsOverlap(
          normalized.start,
          normalized.end,
          appointment.slotStart,
          appointment.slotEnd,
        );
      });

      return {
        start: normalized.start,
        end: normalized.end,
        available: !booked,
      };
    });

    return {
      professionalId,
      date,
      configured: true,
      available: slots.some((slot) => slot.available),
      slots,
    };
  },
});

export const setMedicalAvailability = mutation({
  args: {
    professionalId: v.id("medicalProfessionals"),
    date: v.string(),
    slots: v.array(
      v.object({
        start: v.string(),
        end: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireMedicalProfessional(ctx, args.professionalId);

    const date = assertDateOnly(args.date);

    if (args.slots.length > 100) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Trop de créneaux pour une journée",
      });
    }

    const normalizedSlots = args.slots.map((slot) =>
      assertValidSlot(slot.start, slot.end),
    );

    const sortedSlots = [...normalizedSlots].sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
    );

    for (let index = 1; index < sortedSlots.length; index += 1) {
      const previous = sortedSlots[index - 1];
      const current = sortedSlots[index];

      if (
        slotsOverlap(previous.start, previous.end, current.start, current.end)
      ) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message: "Les créneaux ne doivent pas se chevaucher",
        });
      }
    }

    const existing = await ctx.db
      .query("medicalAvailability")
      .withIndex("by_professional_date", (q) =>
        q.eq("professionalId", args.professionalId).eq("date", date),
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        slots: sortedSlots,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("medicalAvailability", {
      professionalId: args.professionalId,
      date,
      slots: sortedSlots,
      updatedAt: now,
    });
  },
});

export const bookAppointment = mutation({
  args: {
    professionalId: v.id("medicalProfessionals"),
    date: v.string(),
    slotStart: v.string(),
    slotEnd: v.string(),
    type: v.union(v.literal("consultation"), v.literal("teleconsultation")),
    notes: v.optional(v.string()),
    reminder: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const professional = await ctx.db.get(args.professionalId);

    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel de santé introuvable",
      });
    }

    if (professional.status !== "active" || professional.available !== true) {
      throw new ConvexError({
        code: "UNAVAILABLE",
        message: "Ce professionnel n'est pas disponible",
      });
    }

    const date = assertDateOnly(args.date);
    const slot = assertValidSlot(args.slotStart, args.slotEnd);

    const availability = await ctx.db
      .query("medicalAvailability")
      .withIndex("by_professional_date", (q) =>
        q.eq("professionalId", args.professionalId).eq("date", date),
      )
      .unique();

    if (!availability) {
      throw new ConvexError({
        code: "UNAVAILABLE",
        message:
          "Aucun calendrier n'est configuré pour ce professionnel à cette date",
      });
    }

    const configuredSlot = availability.slots.find(
      (availableSlot) =>
        availableSlot.start === slot.start && availableSlot.end === slot.end,
    );

    if (!configuredSlot) {
      throw new ConvexError({
        code: "UNAVAILABLE",
        message: "Ce créneau n'est pas proposé par le professionnel",
      });
    }

    const existingAppointments = await ctx.db
      .query("medicalAppointments")
      .withIndex("by_professional_date", (q) =>
        q.eq("professionalId", args.professionalId).eq("date", date),
      )
      .collect();

    const collision = existingAppointments.some((appointment) => {
      if (appointment.status !== "scheduled") return false;
      if (!appointment.slotStart || !appointment.slotEnd) return false;

      return slotsOverlap(
        slot.start,
        slot.end,
        appointment.slotStart,
        appointment.slotEnd,
      );
    });

    if (collision) {
      throw new ConvexError({
        code: "SLOT_ALREADY_BOOKED",
        message: "Ce créneau vient d'être réservé par un autre patient",
      });
    }

    const scheduledAt = `${date}T${slot.start}:00`;
    const now = Date.now();

    const appointmentId = await ctx.db.insert("medicalAppointments", {
      userId: user._id,
      professionalId: args.professionalId,
      doctorName: professional.name,
      specialty: professional.specialty,
      date,
      slotStart: slot.start,
      slotEnd: slot.end,
      scheduledAt,
      durationMinutes: timeToMinutes(slot.end) - timeToMinutes(slot.start),
      type: args.type,
      status: "scheduled",
      notes: args.notes?.trim() || undefined,
      reminder: args.reminder ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      appointmentId,
      professionalId: args.professionalId,
      date,
      slotStart: slot.start,
      slotEnd: slot.end,
      scheduledAt,
      status: "scheduled" as const,
    };
  },
});

export const cancelAppointment = mutation({
  args: { id: v.id("medicalAppointments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const appointment = await ctx.db.get(args.id);

    if (!appointment) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Rendez-vous introuvable",
      });
    }

    const isAdmin = user.roles?.includes("admin") === true;
    let isDoctor = false;

    if (appointment.professionalId) {
      const professional = await ctx.db.get(appointment.professionalId);
      isDoctor =
        professional !== null &&
        (await isProfessionalOwner(ctx, professional.userId, user));
    }

    if (!isAdmin && appointment.userId !== user._id && !isDoctor) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    if (appointment.status !== "scheduled") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Ce rendez-vous ne peut plus être annulé",
      });
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return {
      appointmentId: args.id,
      status: "cancelled" as const,
    };
  },
});

export const updateAppointment = mutation({
  args: {
    id: v.id("medicalAppointments"),
    status: v.optional(v.union(v.literal("completed"), v.literal("cancelled"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const appointment = await ctx.db.get(args.id);

    if (!appointment) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Rendez-vous introuvable",
      });
    }

    const isAdmin = user.roles?.includes("admin") === true;
    let isDoctor = false;

    if (appointment.professionalId) {
      const professional = await ctx.db.get(appointment.professionalId);
      isDoctor =
        professional !== null &&
        (await isProfessionalOwner(ctx, professional.userId, user));
    }

    if (!isAdmin && appointment.userId !== user._id && !isDoctor) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    if (args.status === "completed" && appointment.status !== "scheduled") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Seul un rendez-vous planifié peut être terminé",
      });
    }

    if (args.status === "cancelled" && appointment.status !== "scheduled") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Seul un rendez-vous planifié peut être annulé",
      });
    }

    const updates: {
      status?: "scheduled" | "completed" | "cancelled";
      notes?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) {
      updates.status = args.status;
    }

    if (args.notes !== undefined) {
      updates.notes = args.notes.trim();
    }

    await ctx.db.patch(args.id, updates);

    return {
      appointmentId: args.id,
      status: args.status ?? appointment.status,
    };
  },
});

export const getAppointments = query({
  args: {
    patientId: v.optional(v.id("users")),
    doctorId: v.optional(v.id("medicalProfessionals")),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = assertPositiveLimit(args.limit, 50);
    const isAdmin = user.roles?.includes("admin") === true;

    if (args.patientId) {
      if (args.patientId !== user._id && !isAdmin) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Non autorisé",
        });
      }

      const appointments = await ctx.db
        .query("medicalAppointments")
        .withIndex("by_user", (q) => q.eq("userId", args.patientId!))
        .order("desc")
        .take(limit);

      if (!args.status) return appointments;
      return appointments
        .filter((a) => a.status === args.status)
        .slice(0, limit);
    }

    if (args.doctorId) {
      const professional = await ctx.db.get(args.doctorId);
      if (!professional) return [];

      const isDoctorOwner = await isProfessionalOwner(
        ctx,
        professional.userId,
        user,
      );

      if (!isAdmin && !isDoctorOwner) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Non autorisé",
        });
      }

      const appointments = await ctx.db
        .query("medicalAppointments")
        .withIndex("by_professional_date", (q) =>
          q.eq("professionalId", args.doctorId!),
        )
        .order("desc")
        .take(limit);

      if (!args.status) return appointments;
      return appointments
        .filter((a) => a.status === args.status)
        .slice(0, limit);
    }

    if (!isAdmin) {
      let appointments = await ctx.db
        .query("medicalAppointments")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(limit);

      if (args.status) {
        appointments = appointments.filter((a) => a.status === args.status);
      }

      return appointments;
    }

    let appointments = await ctx.db
      .query("medicalAppointments")
      .order("desc")
      .take(limit);

    if (args.status) {
      appointments = appointments.filter((a) => a.status === args.status);
    }

    return appointments;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

export const getReviews = query({
  args: { professionalId: v.string() },
  handler: async (ctx, args) => {
    const professionalId = await resolveProfessionalId(
      ctx,
      args.professionalId,
    );

    if (!professionalId) return [];

    return ctx.db
      .query("reviews")
      .withIndex("by_professional", (q) =>
        q.eq("professionalId", professionalId),
      )
      .order("desc")
      .collect();
  },
});

export const addReview = mutation({
  args: {
    professionalId: v.id("medicalProfessionals"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!Number.isFinite(args.rating) || args.rating < 1 || args.rating > 5) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La note doit être comprise entre 1 et 5",
      });
    }

    const comment = args.comment.trim();

    if (!comment) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Le commentaire ne peut pas être vide",
      });
    }

    if (comment.length > 5000) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Le commentaire est trop long",
      });
    }

    const professional = await ctx.db.get(args.professionalId);
    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel introuvable",
      });
    }

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_professional", (q) =>
        q.eq("professionalId", args.professionalId),
      )
      .collect();

    const alreadyReviewed = existing.some(
      (review) => review.patientId === user._id,
    );

    if (alreadyReviewed) {
      throw new ConvexError({
        code: "ALREADY_EXISTS",
        message: "Vous avez déjà évalué ce professionnel",
      });
    }

    const now = new Date().toISOString();

    const reviewId = await ctx.db.insert("reviews", {
      professionalId: args.professionalId,
      patientId: user._id,
      patientName: user.name ?? "Utilisateur",
      rating: args.rating,
      comment,
      date: now,
      likes: 0,
      verified: false,
      helpful: 0,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });

    const reviewCount = existing.length + 1;
    const totalRating =
      existing.reduce((sum, review) => sum + review.rating, 0) + args.rating;

    await ctx.db.patch(args.professionalId, {
      rating: totalRating / reviewCount,
      reviewCount,
      updatedAt: now,
    });

    return reviewId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. MEDICAL QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const askMedicalQuestion = mutation({
  args: {
    professionalId: v.id("medicalProfessionals"),
    question: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const question = args.question.trim();

    if (!question) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La question ne peut pas être vide",
      });
    }

    if (question.length > 5000) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La question est trop longue",
      });
    }

    const professional = await ctx.db.get(args.professionalId);
    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel introuvable",
      });
    }

    const now = new Date().toISOString();

    return ctx.db.insert("questions", {
      professionalId: args.professionalId,
      patientId: user._id,
      patientName: user.name ?? "Utilisateur",
      question,
      date: now,
      likes: 0,
      answers: [],
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const answerMedicalQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const question = await ctx.db.get(args.questionId);

    if (!question) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    }

    const professional = await ctx.db.get(question.professionalId);
    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel introuvable",
      });
    }

    const isAdmin = user.roles?.includes("admin") === true;
    const isDoctor = await isProfessionalOwner(ctx, professional.userId, user);

    if (!isAdmin && !isDoctor) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le professionnel concerné peut répondre",
      });
    }

    const answer = args.answer.trim();
    if (!answer) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La réponse ne peut pas être vide",
      });
    }

    if (answer.length > 10000) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "La réponse est trop longue",
      });
    }

    const now = new Date().toISOString();

    const answerEntry = {
      id: `${args.questionId}:${now}`,
      authorId: user._id,
      author: user.name ?? professional.name,
      content: answer,
      date: now,
      likes: 0,
    };

    await ctx.db.patch(args.questionId, {
      answers: [...question.answers, answerEntry],
      status: "answered",
      updatedAt: now,
    });

    return args.questionId;
  },
});

export const getMedicalQuestions = query({
  args: {
    professionalId: v.optional(v.id("medicalProfessionals")),
    status: v.optional(
      v.union(v.literal("open"), v.literal("answered"), v.literal("closed")),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = assertPositiveLimit(args.limit, 50);

    if (args.professionalId) {
      const professional = await ctx.db.get(args.professionalId);
      if (!professional) return [];

      const isAdmin = user.roles?.includes("admin") === true;
      const isDoctor = await isProfessionalOwner(
        ctx,
        professional.userId,
        user,
      );

      if (!isAdmin && !isDoctor) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Non autorisé",
        });
      }

      const questions = await ctx.db
        .query("questions")
        .withIndex("by_professional", (q) =>
          q.eq("professionalId", args.professionalId!),
        )
        .order("desc")
        .take(limit);

      if (!args.status) return questions;
      return questions.filter((q) => q.status === args.status);
    }

    const questions = await ctx.db
      .query("questions")
      .filter((q) => q.eq(q.field("patientId"), user._id))
      .order("desc")
      .take(limit);

    if (!args.status) return questions;
    return questions.filter((q) => q.status === args.status);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. PRESCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const createPrescription = mutation({
  args: {
    professionalId: v.id("medicalProfessionals"),
    patientId: v.id("users"),
    medications: v.array(
      v.object({
        name: v.string(),
        dosage: v.string(),
        frequency: v.string(),
        duration: v.string(),
        instructions: v.optional(v.string()),
      }),
    ),
    diagnosis: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const professional = await ctx.db.get(args.professionalId);

    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel introuvable",
      });
    }

    const patient = await ctx.db.get(args.patientId);
    if (!patient) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Patient introuvable",
      });
    }

    const isAdmin = user.roles?.includes("admin") === true;
    const isDoctor =
      user.roles?.includes("doctor") === true &&
      (await isProfessionalOwner(ctx, professional.userId, user));

    if (!isAdmin && !isDoctor) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le médecin concerné ou un administrateur peut prescrire",
      });
    }

    if (args.medications.length === 0) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Une ordonnance doit contenir au moins un médicament",
      });
    }

    if (args.medications.length > 50) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Trop de médicaments dans cette ordonnance",
      });
    }

    const medications = args.medications.map((m) => ({
      name: m.name.trim(),
      dosage: m.dosage.trim(),
      frequency: m.frequency.trim(),
      duration: m.duration.trim(),
      instructions: m.instructions?.trim() || undefined,
    }));

    if (
      medications.some(
        (m) => !m.name || !m.dosage || !m.frequency || !m.duration,
      )
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message:
          "Tous les champs obligatoires des médicaments doivent être remplis",
      });
    }

    const now = new Date().toISOString();

    return ctx.db.insert("prescriptions", {
      patientId: args.patientId,
      patientName: patient.name ?? "Patient",
      doctorId: args.professionalId,
      doctorName: professional.name,
      date: now,
      medications,
      notes: args.notes?.trim() || undefined,
      validUntil: now,
      status: "active",
      refills: 0,
      refillsRemaining: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getPrescription = query({
  args: { id: v.id("prescriptions") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const prescription = await ctx.db.get(args.id);

    if (!prescription) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Ordonnance introuvable",
      });
    }

    const isAdmin = user.roles?.includes("admin") === true;
    let isDoctor = false;

    const professional = await ctx.db.get(prescription.doctorId);
    if (professional) {
      isDoctor = await isProfessionalOwner(ctx, professional.userId, user);
    }

    const isPatient = prescription.patientId === user._id;

    if (!isAdmin && !isDoctor && !isPatient) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas autorisé à consulter cette ordonnance",
      });
    }

    return prescription;
  },
});

export const updatePrescription = mutation({
  args: {
    id: v.id("prescriptions"),
    medications: v.optional(
      v.array(
        v.object({
          name: v.string(),
          dosage: v.string(),
          frequency: v.string(),
          duration: v.string(),
          instructions: v.optional(v.string()),
        }),
      ),
    ),
    diagnosis: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("expired"),
        v.literal("cancelled"),
        v.literal("dispensed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const prescription = await ctx.db.get(args.id);

    if (!prescription) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Ordonnance introuvable",
      });
    }

    const isAdmin = user.roles?.includes("admin") === true;
    const professional = await ctx.db.get(prescription.doctorId);

    const isDoctor =
      user.roles?.includes("doctor") === true &&
      professional !== null &&
      (await isProfessionalOwner(ctx, professional.userId, user));

    if (!isAdmin && !isDoctor) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message:
          "Seul le médecin concerné ou un administrateur peut modifier cette ordonnance",
      });
    }

    if (
      args.medications !== undefined &&
      (args.medications.length === 0 || args.medications.length > 50)
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "L'ordonnance doit contenir entre 1 et 50 médicaments",
      });
    }

    const { id, medications, ...rest } = args;

    const updates: {
      medications?: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
      }>;
      diagnosis?: string;
      notes?: string;
      status?: "active" | "expired" | "cancelled" | "dispensed";
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (medications !== undefined) {
      const normalizedMedications = medications.map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration.trim(),
        instructions: m.instructions?.trim() || undefined,
      }));

      if (
        normalizedMedications.some(
          (m) => !m.name || !m.dosage || !m.frequency || !m.duration,
        )
      ) {
        throw new ConvexError({
          code: "INVALID_ARGUMENT",
          message:
            "Tous les champs obligatoires des médicaments doivent être remplis",
        });
      }

      updates.medications = normalizedMedications;
    }

    if (rest.diagnosis !== undefined) {
      updates.diagnosis = rest.diagnosis.trim();
    }

    if (rest.notes !== undefined) {
      updates.notes = rest.notes.trim();
    }

    if (rest.status !== undefined) {
      updates.status = rest.status;
    }

    await ctx.db.patch(id, updates);

    return id;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. MEDICAL STORIES
// ─────────────────────────────────────────────────────────────────────────────

export const getProfessionalStories = query({
  args: {
    professionalId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const professionalId = await resolveProfessionalId(
      ctx,
      args.professionalId,
    );

    if (!professionalId) return [];

    const professional = await ctx.db.get(professionalId);
    if (!professional) return [];

    const limit = assertPositiveLimit(args.limit, 10);

    const ownerId =
      ctx.db.normalizeId("users", professional.userId) ??
      (
        await ctx.db
          .query("users")
          .withIndex("by_uid", (q) => q.eq("uid", professional.userId))
          .unique()
      )?._id;

    if (!ownerId) return [];

    const stories = await ctx.db.query("stories").collect();
    return stories.filter((s) => s.authorId === ownerId).slice(0, limit);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. MEDICAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export const getMedicalRecords = query({
  args: {
    patientId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = assertPositiveLimit(args.limit, 50);
    const isAdmin = user.roles?.includes("admin") === true;

    const patientId = args.patientId ?? user._id;

    if (patientId !== user._id && !isAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    return ctx.db
      .query("medicalRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(limit);
  },
});

export const getMedicalRecord = query({
  args: { id: v.id("medicalRecords") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const record = await ctx.db.get(args.id);

    if (!record) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Dossier médical introuvable",
      });
    }

    const isAdmin = user.roles?.includes("admin") === true;
    if (!isAdmin && record.patientId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous n'êtes pas autorisé à consulter ce dossier",
      });
    }

    return record;
  },
});

export const createMedicalRecord = mutation({
  args: {
    patientId: v.id("users"),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const isAdmin = user.roles?.includes("admin") === true;

    if (args.patientId !== user._id && !isAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    const title = args.title.trim();
    const description = args.description.trim();
    const category = args.category.trim();

    if (!title || !description || !category) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Les champs obligatoires doivent être remplis",
      });
    }

    const typeMap: Record<
      string,
      | "visit"
      | "lab"
      | "imaging"
      | "vaccination"
      | "prescription"
      | "surgery"
      | "hospitalization"
    > = {
      visit: "visit",
      lab: "lab",
      imaging: "imaging",
      vaccination: "vaccination",
      prescription: "prescription",
      surgery: "surgery",
      hospitalization: "hospitalization",
    };

    const type = typeMap[category.toLowerCase()];

    if (!type) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message:
          "La catégorie doit être l'une des suivantes : visit, lab, imaging, vaccination, prescription, surgery, hospitalization",
      });
    }

    const now = new Date().toISOString();

    return ctx.db.insert("medicalRecords", {
      patientId: args.patientId,
      type,
      title,
      date: now,
      summary: description,
      ...(args.documentUrl?.trim()
        ? { attachments: [args.documentUrl.trim()] }
        : {}),
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. MEDICAL FAVORITES
// ─────────────────────────────────────────────────────────────────────────────

export const toggleProfessionalFavorite = mutation({
  args: { professionalId: v.id("medicalProfessionals") },
  handler: async (ctx, args) => {
    await requireUser(ctx);

    const professional = await ctx.db.get(args.professionalId);
    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel introuvable",
      });
    }

    throw new ConvexError({
      code: "FEATURE_NOT_CONFIGURED",
      message:
        "Les favoris médicaux ne sont pas encore reliés à une table dédiée dans le schéma actuel.",
    });
  },
});

export const getMyFavoriteProfessionals = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    assertPositiveLimit(args.limit, 50);
    return [];
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. MEDICAL FOLLOWING
// ─────────────────────────────────────────────────────────────────────────────

export const toggleProfessionalFollow = mutation({
  args: { professionalId: v.id("medicalProfessionals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const professional = await ctx.db.get(args.professionalId);

    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel introuvable",
      });
    }

    const existing = await ctx.db
      .query("followers")
      .withIndex("by_professional_and_user", (q) =>
        q.eq("professionalId", args.professionalId).eq("userId", user._id),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return {
        following: false,
        professionalId: args.professionalId,
      };
    }

    await ctx.db.insert("followers", {
      professionalId: args.professionalId,
      userId: user._id,
      name: user.name ?? "Utilisateur",
      ...(user.avatar ? { avatar: user.avatar } : {}),
      followedAt: new Date().toISOString(),
    });

    return {
      following: true,
      professionalId: args.professionalId,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. TELECONSULTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const createTeleconsultation = mutation({
  args: {
    appointmentId: v.id("medicalAppointments"),
    roomUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Rendez-vous introuvable",
      });
    }

    if (appointment.type !== "teleconsultation") {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Ce rendez-vous n'est pas configuré pour une téléconsultation",
      });
    }

    // ── Fix TS2322 : professionalId est optionnel dans le schéma ─────────
    if (!appointment.professionalId) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Ce rendez-vous n'a pas de professionnel assigné. Impossible de créer une téléconsultation.",
      });
    }

    // ── Fix TS2322 : scheduledAt est optionnel dans le schéma ────────────
    if (!appointment.scheduledAt) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Ce rendez-vous n'a pas d'heure planifiée. Impossible de créer une téléconsultation.",
      });
    }

    const professional = await ctx.db.get(appointment.professionalId);

    if (!professional) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Professionnel de santé introuvable",
      });
    }

    const isAdmin = user.roles?.includes("admin") === true;
    const isDoctor = await isProfessionalOwner(ctx, professional.userId, user);
    const isPatient = appointment.userId === user._id;

    if (!isAdmin && !isDoctor && !isPatient) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    const roomUrl = args.roomUrl?.trim();

    if (!roomUrl) {
      throw new ConvexError({
        code: "TELECONSULTATION_ROOM_REQUIRED",
        message:
          "Une URL de salle de téléconsultation réelle doit être fournie avant la création.",
      });
    }

    let parsedRoomUrl: URL;
    try {
      parsedRoomUrl = new URL(roomUrl);
    } catch {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "URL de téléconsultation invalide",
      });
    }

    if (
      parsedRoomUrl.protocol !== "https:" &&
      parsedRoomUrl.protocol !== "http:"
    ) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "L'URL de téléconsultation doit utiliser HTTP ou HTTPS",
      });
    }

    const existing = await ctx.db
      .query("teleconsultations")
      .withIndex("by_patient", (q) => q.eq("patientId", appointment.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("doctorId"), appointment.professionalId),
          q.eq(q.field("scheduledAt"), appointment.scheduledAt),
        ),
      )
      .first();

    if (existing) return existing;

    const now = new Date().toISOString();

    return ctx.db.insert("teleconsultations", {
      doctorId: appointment.professionalId,
      patientId: appointment.userId,
      scheduledAt: appointment.scheduledAt,
      status: "scheduled",
      durationMinutes: appointment.durationMinutes,
      roomUrl: parsedRoomUrl.toString(),
      ...(appointment.notes ? { notes: appointment.notes } : {}),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getTeleconsultation = query({
  args: { appointmentId: v.id("medicalAppointments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Rendez-vous introuvable",
      });
    }

    const professional = appointment.professionalId
      ? await ctx.db.get(appointment.professionalId)
      : null;

    const isAdmin = user.roles?.includes("admin") === true;
    const isDoctor =
      professional !== null &&
      (await isProfessionalOwner(ctx, professional.userId, user));
    const isPatient = appointment.userId === user._id;

    if (!isAdmin && !isDoctor && !isPatient) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    return ctx.db
      .query("teleconsultations")
      .withIndex("by_patient", (q) => q.eq("patientId", appointment.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("doctorId"), appointment.professionalId),
          q.eq(q.field("scheduledAt"), appointment.scheduledAt),
        ),
      )
      .first();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. NEARBY HEALTH SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const findNearbyHospitals = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertValidCoordinates(args.latitude, args.longitude);

    const radiusKm = args.radiusKm ?? 25;
    const limit = assertPositiveLimit(args.limit, 20);

    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 500) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Rayon de recherche invalide",
      });
    }

    const hospitals = await ctx.db.query("hospitals").collect();

    return hospitals
      .filter((h) => h.latitude !== undefined && h.longitude !== undefined)
      .map((h) => ({
        hospital: h,
        distanceKm: calculateDistanceKm(
          args.latitude,
          args.longitude,
          h.latitude!,
          h.longitude!,
        ),
      }))
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  },
});

export const findNearbyPharmacies = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusKm: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertValidCoordinates(args.latitude, args.longitude);

    const radiusKm = args.radiusKm ?? 25;
    const limit = assertPositiveLimit(args.limit, 20);

    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 500) {
      throw new ConvexError({
        code: "INVALID_ARGUMENT",
        message: "Rayon de recherche invalide",
      });
    }

    const pharmacies = await ctx.db.query("pharmacies").collect();

    return pharmacies
      .filter((p) => p.latitude !== undefined && p.longitude !== undefined)
      .map((p) => ({
        pharmacy: p,
        distanceKm: calculateDistanceKm(
          args.latitude,
          args.longitude,
          p.latitude!,
          p.longitude!,
        ),
      }))
      .filter((item) => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. HEALTH SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export const searchHealth = query({
  args: {
    query: v.string(),
    city: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const search = args.query.trim().toLowerCase();
    const limit = assertPositiveLimit(args.limit, 50);

    if (!search) {
      return {
        professionals: [],
        hospitals: [],
        pharmacies: [],
        laboratories: [],
        clinics: [],
      };
    }

    const [professionals, hospitals, pharmacies, laboratories, clinics] =
      await Promise.all([
        ctx.db.query("medicalProfessionals").collect(),
        ctx.db.query("hospitals").collect(),
        ctx.db.query("pharmacies").collect(),
        ctx.db.query("laboratories").collect(),
        ctx.db.query("clinics").collect(),
      ]);

    return {
      professionals: professionals
        .filter((p) => {
          const matchesSearch =
            p.name?.toLowerCase().includes(search) ||
            p.specialty?.toLowerCase().includes(search) ||
            p.city?.toLowerCase().includes(search);
          const matchesCity = !args.city || p.city === args.city;
          return matchesSearch && matchesCity;
        })
        .slice(0, limit),

      hospitals: hospitals
        .filter((h) => {
          const matchesSearch =
            h.name.toLowerCase().includes(search) ||
            h.city.toLowerCase().includes(search);
          const matchesCity = !args.city || h.city === args.city;
          return matchesSearch && matchesCity;
        })
        .slice(0, limit),

      pharmacies: pharmacies
        .filter((p) => {
          const matchesSearch =
            p.name.toLowerCase().includes(search) ||
            p.city.toLowerCase().includes(search);
          const matchesCity = !args.city || p.city === args.city;
          return matchesSearch && matchesCity;
        })
        .slice(0, limit),

      laboratories: laboratories
        .filter((l) => {
          const matchesSearch =
            l.name.toLowerCase().includes(search) ||
            l.city.toLowerCase().includes(search);
          const matchesCity = !args.city || l.city === args.city;
          return matchesSearch && matchesCity;
        })
        .slice(0, limit),

      clinics: clinics
        .filter((c) => {
          const matchesSearch =
            c.name.toLowerCase().includes(search) ||
            c.city.toLowerCase().includes(search);
          const matchesCity = !args.city || c.city === args.city;
          return matchesSearch && matchesCity;
        })
        .slice(0, limit),
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. HEALTH DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const getHealthDashboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = assertPositiveLimit(args.limit, 20);

    const [appointments, prescriptions, records] = await Promise.all([
      ctx.db
        .query("medicalAppointments")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(limit),

      ctx.db
        .query("prescriptions")
        .withIndex("by_patient", (q) => q.eq("patientId", user._id))
        .order("desc")
        .take(limit),

      ctx.db
        .query("medicalRecords")
        .withIndex("by_patient", (q) => q.eq("patientId", user._id))
        .order("desc")
        .take(limit),
    ]);

    return {
      appointments,
      questions: [],
      prescriptions,
      records,
      favorites: [],
    };
  },
});
