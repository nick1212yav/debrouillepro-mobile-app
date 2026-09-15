// convex/health.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  return user;
}

async function requireAdmin(ctx: MutationCtx) {
  const user = await requireUser(ctx);
  if (!user.roles?.includes("admin"))
    throw new ConvexError({ code: "FORBIDDEN", message: "Admin requis" });
  return user;
}

// Helper de résolution générique pour lier n'importe quel ID (publication, utilisateur ou direct) au médecin
async function resolveProfessionalId(
  ctx: QueryCtx,
  inputId: string,
): Promise<Id<"medicalProfessionals"> | null> {
  const directId = ctx.db.normalizeId("medicalProfessionals", inputId);
  if (directId) return directId;

  const pubId = ctx.db.normalizeId("publications", inputId);
  if (pubId) {
    const publication = await ctx.db.get(pubId);
    if (publication) {
      if (publication.meta) {
        try {
          const parsed = JSON.parse(publication.meta);
          const metaId = parsed.professionalId || parsed.id || publication.meta;
          const testId = ctx.db.normalizeId("medicalProfessionals", metaId);
          if (testId) return testId;
        } catch {
          const testId = ctx.db.normalizeId(
            "medicalProfessionals",
            publication.meta,
          );
          if (testId) return testId;
        }
      }

      const author = await ctx.db.get(publication.authorId);
      if (author) {
        const authorAny = author as any;
        const authUid =
          authorAny.userId ||
          authorAny.uid ||
          authorAny.tokenIdentifier ||
          String(author._id);

        const professional = await ctx.db
          .query("medicalProfessionals")
          .filter((q) =>
            q.or(
              q.eq(q.field("userId"), authUid),
              q.eq(q.field("userId"), String(author._id)),
              q.eq(q.field("userId"), author._id),
            ),
          )
          .first();

        if (professional) return professional._id;

        if (author.name) {
          const professionalByName = await ctx.db
            .query("medicalProfessionals")
            .filter((q) => q.eq(q.field("name"), author.name))
            .first();
          if (professionalByName) return professionalByName._id;
        }
      }

      if (publication.title) {
        const professionalByTitle = await ctx.db
          .query("medicalProfessionals")
          .filter((q) => q.eq(q.field("name"), publication.title))
          .first();
        if (professionalByTitle) return professionalByTitle._id;
      }
    }
  }

  const userId = ctx.db.normalizeId("users", inputId);
  if (userId) {
    const professional = await ctx.db
      .query("medicalProfessionals")
      .filter((q) =>
        q.or(
          q.eq(q.field("userId"), String(userId)),
          q.eq(q.field("userId"), userId),
        ),
      )
      .first();
    if (professional) return professional._id;
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
    if (args.specialty)
      professionals = professionals.filter(
        (p) => p.specialty === args.specialty,
      );
    if (args.city)
      professionals = professionals.filter((p) => p.city === args.city);
    if (args.online !== undefined)
      professionals = professionals.filter((p) => p.online === args.online);
    if (args.available !== undefined)
      professionals = professionals.filter(
        (p) => p.available === args.available,
      );
    if (args.minRating)
      professionals = professionals.filter((p) => p.rating >= args.minRating!);
    if (args.search) {
      const s = args.search.toLowerCase();
      professionals = professionals.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.specialty.toLowerCase().includes(s),
      );
    }
    professionals.sort((a, b) => b.rating - a.rating);
    if (args.limit) professionals = professionals.slice(0, args.limit);
    return professionals;
  },
});

export const getProfessional = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    console.log("[getProfessional] ID reçu depuis l'URL :", args.id);
    const resolvedId = await resolveProfessionalId(ctx, args.id);

    // Fallback ultime : Si le médecin n'existe pas encore formellement en BDD, on génère son profil depuis la publication [2]
    if (!resolvedId) {
      const pubId = ctx.db.normalizeId("publications", args.id);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication) {
          console.log(
            "[getProfessional] Fallback ultime : Génération dynamique d'un profil fictif depuis la publication.",
          );
          const author = await ctx.db.get(publication.authorId);
          let parsedMeta: any = {};
          if (publication.meta) {
            try {
              parsedMeta = JSON.parse(publication.meta);
            } catch {
              // ignore
            }
          }

          let resolvedLanguages: string[] = ["Français"];
          if (parsedMeta.languages) {
            if (Array.isArray(parsedMeta.languages)) {
              resolvedLanguages = parsedMeta.languages;
            } else if (typeof parsedMeta.languages === "string") {
              resolvedLanguages = parsedMeta.languages
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);
            }
          }

          let resolvedSpecialities: string[] = ["Généraliste"];
          if (parsedMeta.specialities) {
            if (Array.isArray(parsedMeta.specialities)) {
              resolvedSpecialities = parsedMeta.specialities;
            } else if (typeof parsedMeta.specialities === "string") {
              resolvedSpecialities = parsedMeta.specialities
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);
            }
          } else if (parsedMeta.specialty) {
            resolvedSpecialities = [parsedMeta.specialty];
          }

          let resolvedInsurances: string[] = [];
          if (parsedMeta.insurances) {
            if (Array.isArray(parsedMeta.insurances)) {
              resolvedInsurances = parsedMeta.insurances;
            } else if (typeof parsedMeta.insurances === "string") {
              resolvedInsurances = parsedMeta.insurances
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);
            }
          }

          return {
            _id: publication._id as any,
            userId: String(publication.authorId),
            name: publication.title || author?.name || "Professionnel de Santé",
            specialty: parsedMeta.specialty || "Généraliste",
            fees:
              parsedMeta.fees ||
              parsedMeta.pricePerSeat ||
              parsedMeta.price ||
              5,
            currency: parsedMeta.currency || "FCFA",
            address: parsedMeta.address || "12 av mania, Kinshasa",
            city: parsedMeta.city || "Kinshasa",
            country: parsedMeta.country || "Congo",
            phone: parsedMeta.phone || author?.phone || "",
            email: parsedMeta.email || author?.email || "",
            website: parsedMeta.website || "",
            videoUrl: parsedMeta.videoUrl || "",
            bio: publication.description || "Profil en cours de configuration.",
            experience: parsedMeta.experience || 3,
            education: parsedMeta.education || [],
            specialities: resolvedSpecialities,
            languages: resolvedLanguages,
            certificates: parsedMeta.certificates || [],
            awards: parsedMeta.awards || [],
            insurances: resolvedInsurances,
            images: publication.images || [],
            online: true,
            verified: true,
            available: true,
            rating: parsedMeta.rating || 0,
            reviewCount: parsedMeta.reviewCount || 0,
            patients: 0,
            appointments: 0,
            isLiked: false,
            isFollowing: false,
            isLive: false,
            status: "active",
          };
        }
      }
    }

    if (!resolvedId) {
      console.warn(
        "[getProfessional] ÉCHEC CRITIQUE : Impossible de lier cet ID.",
      );
      return null;
    }

    const professional = await ctx.db.get(resolvedId);
    if (!professional) return null;

    console.log(
      "[getProfessional] SUCCÈS : Médecin résolu :",
      professional.name,
    );
    return professional;
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
    return ctx.db.insert("medicalProfessionals", {
      ...args,
      rating: args.rating ?? 0,
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
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

export const deleteProfessional = mutation({
  args: { id: v.id("medicalProfessionals") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
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
    if (args.city) hospitals = hospitals.filter((h) => h.city === args.city);
    if (args.emergency !== undefined)
      hospitals = hospitals.filter((h) => h.emergency === args.emergency);
    if (args.specialty)
      hospitals = hospitals.filter((h) =>
        h.services?.includes(args.specialty!),
      );
    if (args.minRating)
      hospitals = hospitals.filter((h) => h.rating >= args.minRating!);
    if (args.search) {
      const s = args.search.toLowerCase();
      hospitals = hospitals.filter((h) => h.name.toLowerCase().includes(s));
    }
    hospitals.sort((a, b) => b.rating - a.rating);
    if (args.limit) hospitals = hospitals.slice(0, args.limit);
    return hospitals;
  },
});

export const getHospital = query({
  args: { id: v.id("hospitals") },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.id);
    if (!hospital)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hôpital introuvable",
      });
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
    return ctx.db.insert("hospitals", {
      ...args,
      rating: args.rating ?? 0,
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
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

export const getHospitalServices = query({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital) return [];
    return hospital.services || [];
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
    if (args.city) pharmacies = pharmacies.filter((p) => p.city === args.city);
    if (args.openNow !== undefined)
      pharmacies = pharmacies.filter((p) => p.open === args.openNow);
    if (args.minRating)
      pharmacies = pharmacies.filter((p) => p.rating >= args.minRating!);
    if (args.services)
      pharmacies = pharmacies.filter((p) =>
        args.services!.every((s) => p.services?.includes(s)),
      );
    if (args.delivery !== undefined)
      pharmacies = pharmacies.filter((p) => p.delivery === args.delivery);
    if (args.search) {
      const s = args.search.toLowerCase();
      pharmacies = pharmacies.filter((p) => p.name.toLowerCase().includes(s));
    }
    pharmacies.sort((a, b) => b.rating - a.rating);
    if (args.limit) pharmacies = pharmacies.slice(0, args.limit);
    return pharmacies;
  },
});

export const getPharmacy = query({
  args: { id: v.id("pharmacies") },
  handler: async (ctx, args) => {
    const pharmacy = await ctx.db.get(args.id);
    if (!pharmacy)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pharmacie introuvable",
      });
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
    return ctx.db.insert("pharmacies", {
      ...args,
      rating: args.rating ?? 0,
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
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
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
    let labs = await ctx.db.query("laboratories").collect();
    if (args.city) labs = labs.filter((l) => l.city === args.city);
    if (args.openNow !== undefined)
      labs = labs.filter((l) => l.open === args.openNow);
    if (args.minRating) labs = labs.filter((l) => l.rating >= args.minRating!);
    if (args.search) {
      const s = args.search.toLowerCase();
      labs = labs.filter((l) => l.name.toLowerCase().includes(s));
    }
    labs.sort((a, b) => b.rating - a.rating);
    if (args.limit) labs = labs.slice(0, args.limit);
    return labs;
  },
});

export const getLaboratory = query({
  args: { id: v.id("laboratories") },
  handler: async (ctx, args) => {
    const lab = await ctx.db.get(args.id);
    if (!lab)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Laboratoire introuvable",
      });
    return lab;
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
    return ctx.db.insert("laboratories", {
      ...args,
      rating: args.rating ?? 0,
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
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
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
    if (args.city) clinics = clinics.filter((c) => c.city === args.city);
    if (args.emergency !== undefined)
      clinics = clinics.filter((c) => c.emergency === args.emergency);
    if (args.specialty)
      clinics = clinics.filter((c) => c.specialties?.includes(args.specialty!));
    if (args.search) {
      const s = args.search.toLowerCase();
      clinics = clinics.filter((c) => c.name.toLowerCase().includes(s));
    }
    if (args.limit) clinics = clinics.slice(0, args.limit);
    return clinics;
  },
});

export const getClinic = query({
  args: { id: v.id("clinics") },
  handler: async (ctx, args) => {
    const clinic = await ctx.db.get(args.id);
    if (!clinic)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Clinique introuvable",
      });
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
    const { id, ...updates } = args; // ✅ Correction de la coquille ici
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
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
    if (args.city) ambulances = ambulances.filter((a) => a.city === args.city);
    if (args.available !== undefined)
      ambulances = ambulances.filter((a) => a.available === args.available);
    if (args.limit) ambulances = ambulances.slice(0, args.limit);
    return ambulances;
  },
});

export const getAmbulance = query({
  args: { id: v.id("ambulances") },
  handler: async (ctx, args) => {
    const ambulance = await ctx.db.get(args.id);
    if (!ambulance)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Service introuvable",
      });
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
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. AVAILABILITY & BOOKING
// ─────────────────────────────────────────────────────────────────────────────

export const getAvailability = query({
  args: {
    professionalId: v.string(),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slots = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];
    return {
      available: "Aujourd'hui",
      slots,
      waitTime: "15 min",
      date: args.date || new Date().toISOString().split("T")[0],
    };
  },
});

export const bookAppointment = mutation({
  args: {
    professionalId: v.id("medicalProfessionals"),
    slot: v.string(),
    type: v.union(v.literal("consultation"), v.literal("teleconsultation")),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    reminder: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const professional = await ctx.db.get(args.professionalId);
    if (!professional)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Médecin introuvable",
      });
    const appointmentId = await ctx.db.insert("medicalAppointments", {
      userId: user._id,
      doctorName: professional.name,
      specialty: professional.specialty,
      date: args.date || new Date().toISOString(),
      type: args.type,
      durationMinutes: 30,
      status: "scheduled",
      notes: args.notes,
      reminder: args.reminder ?? true,
    });
    return { appointmentId };
  },
});

export const cancelAppointment = mutation({
  args: { id: v.id("medicalAppointments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const apt = await ctx.db.get(args.id);
    if (!apt || apt.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await ctx.db.patch(args.id, { status: "cancelled" });
  },
});

export const updateAppointment = mutation({
  args: {
    id: v.id("medicalAppointments"),
    status: v.optional(v.union(v.literal("completed"), v.literal("cancelled"))),
    notes: v.optional(v.string()),
    slot: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const apt = await ctx.db.get(args.id);
    if (!apt || apt.userId !== user._id)
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const getAppointments = query({
  args: {
    patientId: v.optional(v.id("users")),
    doctorId: v.optional(v.id("medicalProfessionals")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let appointments = await ctx.db.query("medicalAppointments").collect();
    if (args.patientId) {
      appointments = appointments.filter((a) => a.userId === args.patientId);
    } else if (args.doctorId) {
      const doctor = await ctx.db.get(args.doctorId);
      if (doctor) {
        appointments = appointments.filter((a) => a.doctorName === doctor.name);
      }
    } else {
      appointments = appointments.filter((a) => a.userId === user._id);
    }
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
    let resolvedId: Id<"medicalProfessionals"> | null = ctx.db.normalizeId(
      "medicalProfessionals",
      args.professionalId,
    );
    if (!resolvedId) {
      const pubId = ctx.db.normalizeId("publications", args.professionalId);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication && publication.title) {
          const professionalByTitle = await ctx.db
            .query("medicalProfessionals")
            .filter((q) => q.eq(q.field("name"), publication.title))
            .first();
          if (professionalByTitle) {
            resolvedId = professionalByTitle._id;
          }
        }
      }
    }

    if (!resolvedId) return [];

    return ctx.db
      .query("reviews")
      .withIndex("by_professional", (q) => q.eq("professionalId", resolvedId!))
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
    const reviewId = await ctx.db.insert("reviews", {
      professionalId: args.professionalId,
      patientId: user._id,
      patientName: user.name || "Anonyme",
      rating: args.rating,
      comment: args.comment,
      date: new Date().toISOString(),
      likes: 0,
      verified: true,
      helpful: 0,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_professional", (q) =>
        q.eq("professionalId", args.professionalId),
      )
      .collect();
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await ctx.db.patch(args.professionalId, {
      rating: avg,
      reviewCount: reviews.length,
    });
    return reviewId;
  },
});

export const likeReview = mutation({
  args: { reviewId: v.id("reviews") },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review)
      throw new ConvexError({ code: "NOT_FOUND", message: "Avis introuvable" });
    await ctx.db.patch(args.reviewId, { likes: review.likes + 1 });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. QUESTIONS & ANSWERS
// ─────────────────────────────────────────────────────────────────────────────

export const getQuestions = query({
  args: { professionalId: v.string() },
  handler: async (ctx, args) => {
    let resolvedId: Id<"medicalProfessionals"> | null = ctx.db.normalizeId(
      "medicalProfessionals",
      args.professionalId,
    );
    if (!resolvedId) {
      const pubId = ctx.db.normalizeId("publications", args.professionalId);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication && publication.title) {
          const professionalByTitle = await ctx.db
            .query("medicalProfessionals")
            .filter((q) => q.eq(q.field("name"), publication.title))
            .first();
          if (professionalByTitle) {
            resolvedId = professionalByTitle._id;
          }
        }
      }
    }

    if (!resolvedId) return [];

    return ctx.db
      .query("questions")
      .withIndex("by_professional", (q) => q.eq("professionalId", resolvedId!))
      .collect();
  },
});

export const askQuestion = mutation({
  args: {
    professionalId: v.id("medicalProfessionals"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("questions", {
      professionalId: args.professionalId,
      patientId: user._id,
      patientName: user.name || "Anonyme",
      question: args.question,
      date: new Date().toISOString(),
      likes: 0,
      answers: [],
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const answerQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const question = await ctx.db.get(args.questionId);
    if (!question)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    const answer = {
      id: `ans_${Date.now()}`,
      authorId: user._id,
      author: user.name || "Médecin",
      content: args.content,
      date: new Date().toISOString(),
      likes: 0,
    };
    const answers = [...(question.answers || []), answer];
    await ctx.db.patch(args.questionId, {
      answers,
      status: "answered",
      updatedAt: new Date().toISOString(),
    });
  },
});

export const likeQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    await ctx.db.patch(args.questionId, { likes: question.likes + 1 });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. FOLLOWERS & LIKES
// ─────────────────────────────────────────────────────────────────────────────

export const getFollowers = query({
  args: { professionalId: v.string() },
  handler: async (ctx, args) => {
    let resolvedId: Id<"medicalProfessionals"> | null = ctx.db.normalizeId(
      "medicalProfessionals",
      args.professionalId,
    );
    if (!resolvedId) {
      const pubId = ctx.db.normalizeId("publications", args.professionalId);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication && publication.title) {
          const professionalByTitle = await ctx.db
            .query("medicalProfessionals")
            .filter((q) => q.eq(q.field("name"), publication.title))
            .first();
          if (professionalByTitle) {
            resolvedId = professionalByTitle._id;
          }
        }
      }
    }

    if (!resolvedId) return [];

    return ctx.db
      .query("followers")
      .withIndex("by_professional", (q) => q.eq("professionalId", resolvedId!))
      .collect();
  },
});

export const toggleFollow = mutation({
  args: { professionalId: v.id("medicalProfessionals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("followers")
      .withIndex("by_professional_and_user", (q) =>
        q.eq("professionalId", args.professionalId).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { followed: false };
    } else {
      await ctx.db.insert("followers", {
        professionalId: args.professionalId,
        userId: user._id,
        name: user.name || "Utilisateur",
        avatar: user.avatar,
        followedAt: new Date().toISOString(),
      });
      return { followed: true };
    }
  },
});

export const toggleLike = mutation({
  args: { professionalId: v.id("medicalProfessionals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_professional_and_user", (q) =>
        q.eq("professionalId", args.professionalId).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("likes", {
        professionalId: args.professionalId,
        userId: user._id,
        createdAt: new Date().toISOString(),
      });
      return { liked: true };
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. ARTICLES, VIDEOS, STORIES
// ─────────────────────────────────────────────────────────────────────────────

export const getArticles = query({
  args: {
    professionalId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let resolvedId: Id<"medicalProfessionals"> | null = ctx.db.normalizeId(
      "medicalProfessionals",
      args.professionalId,
    );
    if (!resolvedId) {
      const pubId = ctx.db.normalizeId("publications", args.professionalId);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication && publication.title) {
          const professionalByTitle = await ctx.db
            .query("medicalProfessionals")
            .filter((q) => q.eq(q.field("name"), publication.title))
            .first();
          if (professionalByTitle) {
            resolvedId = professionalByTitle._id;
          }
        }
      }
    }

    if (!resolvedId) return [];

    return ctx.db
      .query("articles")
      .withIndex("by_professional", (q) => q.eq("professionalId", resolvedId!))
      .take(args.limit ?? 10);
  },
});

export const getVideos = query({
  args: {
    professionalId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let resolvedId: Id<"medicalProfessionals"> | null = ctx.db.normalizeId(
      "medicalProfessionals",
      args.professionalId,
    );
    if (!resolvedId) {
      const pubId = ctx.db.normalizeId("publications", args.professionalId);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication && publication.title) {
          const professionalByTitle = await ctx.db
            .query("medicalProfessionals")
            .filter((q) => q.eq(q.field("name"), publication.title))
            .first();
          if (professionalByTitle) {
            resolvedId = professionalByTitle._id;
          }
        }
      }
    }

    if (!resolvedId) return [];

    return ctx.db
      .query("videos")
      .withIndex("by_professional", (q) => q.eq("professionalId", resolvedId!))
      .take(args.limit ?? 10);
  },
});

export const getStories = query({
  args: {
    professionalId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let resolvedId: Id<"medicalProfessionals"> | null = ctx.db.normalizeId(
      "medicalProfessionals",
      args.professionalId,
    );
    if (!resolvedId) {
      const pubId = ctx.db.normalizeId("publications", args.professionalId);
      if (pubId) {
        const publication = await ctx.db.get(pubId);
        if (publication && publication.title) {
          const professionalByTitle = await ctx.db
            .query("medicalProfessionals")
            .filter((q) => q.eq(q.field("name"), publication.title))
            .first();
          if (professionalByTitle) {
            resolvedId = professionalByTitle._id;
          }
        }
      }
    }

    if (!resolvedId) return [];
    const professional = await ctx.db.get(resolvedId);
    if (!professional) return [];
    const all = await ctx.db.query("stories").collect();
    return all
      .filter((s) => s.authorId === professional.userId)
      .slice(0, args.limit ?? 10);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. MEDICAL RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export const getMedicalRecords = query({
  args: { patientId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Connexion requise",
      });
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Utilisateur introuvable",
      });
    const targetId = args.patientId || user._id;
    if (targetId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    return ctx.db
      .query("medicalRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", targetId))
      .collect();
  },
});

export const addMedicalRecord = mutation({
  args: {
    patientId: v.id("users"),
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
    doctorId: v.optional(v.id("medicalProfessionals")),
    summary: v.string(),
    details: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    return ctx.db.insert("medicalRecords", {
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateMedicalRecord = mutation({
  args: {
    id: v.id("medicalRecords"),
    type: v.optional(
      v.union(
        v.literal("visit"),
        v.literal("lab"),
        v.literal("imaging"),
        v.literal("vaccination"),
        v.literal("prescription"),
        v.literal("surgery"),
        v.literal("hospitalization"),
      ),
    ),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    doctor: v.optional(v.string()),
    doctorId: v.optional(v.id("medicalProfessionals")),
    summary: v.optional(v.string()),
    details: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const record = await ctx.db.get(args.id);
    if (!record)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Dossier introuvable",
      });
    if (record.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. PRESCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getPrescriptions = query({
  args: {
    patientId: v.optional(v.id("users")),
    doctorId: v.optional(v.id("medicalProfessionals")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const targetId = args.patientId || user._id;
    if (targetId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    let query = ctx.db
      .query("prescriptions")
      .withIndex("by_patient", (q) => q.eq("patientId", targetId));
    if (args.doctorId)
      query = query.filter((q) => q.eq(q.field("doctorId"), args.doctorId!));
    return query.collect();
  },
});

export const getPrescription = query({
  args: { id: v.id("prescriptions") },
  handler: async (ctx, args) => {
    const prescription = await ctx.db.get(args.id);
    if (!prescription)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Ordonnance introuvable",
      });
    const user = await requireUser(ctx);
    if (prescription.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    return prescription;
  },
});

export const addPrescription = mutation({
  args: {
    patientId: v.id("users"),
    doctorId: v.id("medicalProfessionals"),
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
    refills: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!user.roles?.includes("admin") && !user.roles?.includes("doctor"))
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul un médecin ou admin peut prescrire",
      });
    return ctx.db.insert("prescriptions", {
      ...args,
      patientName: (await ctx.db.get(args.patientId))?.name || "Patient",
      doctorName: (await ctx.db.get(args.doctorId))?.name || "Médecin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      refillsRemaining: args.refills,
    });
  },
});

export const updatePrescription = mutation({
  args: {
    id: v.id("prescriptions"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("expired"),
        v.literal("cancelled"),
        v.literal("dispensed"),
      ),
    ),
    refills: v.optional(v.number()),
    notes: v.optional(v.string()),
    medications: v.optional(
      v.array(
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
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!user.roles?.includes("admin") && !user.roles?.includes("doctor"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. VACCINATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getVaccinations = query({
  args: { patientId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const targetId = args.patientId || user._id;
    if (targetId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    return ctx.db
      .query("vaccinations")
      .withIndex("by_patient", (q) => q.eq("patientId", targetId))
      .collect();
  },
});

export const addVaccination = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    return ctx.db.insert("vaccinations", {
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateVaccination = mutation({
  args: {
    id: v.id("vaccinations"),
    name: v.optional(v.string()),
    date: v.optional(v.string()),
    nextDose: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("completed"),
        v.literal("pending"),
        v.literal("overdue"),
      ),
    ),
    administeredBy: v.optional(v.string()),
    location: v.optional(v.string()),
    batchNumber: v.optional(v.string()),
    sideEffects: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const vaccination = await ctx.db.get(args.id);
    if (!vaccination)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Vaccination introuvable",
      });
    if (vaccination.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. EMERGENCY
// ─────────────────────────────────────────────────────────────────────────────

export const getNearbyEmergencyCenters = query({
  args: { lat: v.number(), lng: v.number(), radius: v.optional(v.number()) },
  handler: async () => {
    return [
      {
        _id: "center1",
        name: "CHU de Kinshasa",
        address: "1 Avenue de la Clinique",
        phone: "+243 123456789",
        type: "hospital",
        distance: 2.3,
        eta: 10,
        open: true,
        latitude: -4.325,
        longitude: 15.322,
      },
      {
        _id: "center2",
        name: "Hôpital Saint-Joseph",
        address: "45 Rue des Soeurs",
        phone: "+243 987654321",
        type: "hospital",
        distance: 5.1,
        eta: 15,
        open: false,
        latitude: -4.35,
        longitude: 15.3,
      },
    ];
  },
});

export const shareEmergencyLocation = mutation({
  args: { lat: v.number(), lng: v.number() },
  handler: async (ctx) => {
    await requireUser(ctx);
    return { success: true };
  },
});

export const notifyEmergencyContacts = mutation({
  args: { message: v.optional(v.string()) },
  handler: async (ctx) => {
    await requireUser(ctx);
    return { success: true };
  },
});

export const sendEmergencyAlert = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    contactPhone: v.optional(v.string()),
  },
  handler: async (ctx) => {
    await requireUser(ctx);
    return { alertId: `alert_${Date.now()}` };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const processPayment = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    method: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return {
      transactionId: `tx_${Date.now()}`,
      status: "completed",
      receipt: `https://example.com/receipt/tx_${Date.now()}`,
      amount: args.amount,
      currency: args.currency,
      method: args.method,
      date: new Date().toISOString(),
    };
  },
});

export const refundPayment = mutation({
  args: { transactionId: v.string() },
  handler: async (ctx) => {
    await requireUser(ctx);
    return { success: true };
  },
});

export const verifyPayment = mutation({
  args: { transactionId: v.string() },
  handler: async () => {
    return { status: "completed", amount: 100 };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. PHARMACY ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export const createPharmacyOrder = mutation({
  args: {
    pharmacyId: v.id("pharmacies"),
    items: v.array(
      v.object({
        productId: v.string(),
        quantity: v.number(),
      }),
    ),
    deliveryOption: v.union(v.literal("pickup"), v.literal("delivery")),
    deliveryAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pharmacy = await ctx.db.get(args.pharmacyId);
    if (!pharmacy)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pharmacie introuvable",
      });
    const total = args.items.reduce((sum, item) => {
      const product = pharmacy.products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    const order = {
      pharmacyId: args.pharmacyId,
      patientId: user._id,
      items: args.items.map((item) => {
        const product = pharmacy.products.find((p) => p.id === item.productId);
        return {
          ...item,
          productName: product?.name || "Produit",
          price: product?.price || 0,
        };
      }),
      total,
      currency: pharmacy.products?.[0]?.currency || "FCFA",
      status: "pending" as const,
      deliveryOption: args.deliveryOption,
      deliveryAddress: args.deliveryAddress,
      paymentMethod: "pending",
      paymentStatus: "pending" as const,
      notes: args.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return ctx.db.insert("pharmacyOrders", order);
  },
});

export const updatePharmacyOrder = mutation({
  args: {
    id: v.id("pharmacyOrders"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("preparing"),
        v.literal("ready"),
        v.literal("delivered"),
        v.literal("cancelled"),
        v.literal("refunded"),
      ),
    ),
    deliveryAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.id);
    if (!order)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commande introuvable",
      });
    if (order.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

export const cancelPharmacyOrder = mutation({
  args: { id: v.id("pharmacyOrders") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.id);
    if (!order)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Commande introuvable",
      });
    if (order.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await ctx.db.patch(args.id, { status: "cancelled" });
  },
});

export const checkPharmacyStock = mutation({
  args: {
    pharmacyId: v.id("pharmacies"),
    items: v.array(v.object({ productId: v.string(), quantity: v.number() })),
  },
  handler: async (ctx, args) => {
    const pharmacy = await ctx.db.get(args.pharmacyId);
    if (!pharmacy)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Pharmacie introuvable",
      });
    const available = args.items.every((item) => {
      const product = pharmacy.products.find((p) => p.id === item.productId);
      return product && product.stock >= item.quantity;
    });
    return { available };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 18. HOSPITAL APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const bookHospitalAppointment = mutation({
  args: {
    hospitalId: v.id("hospitals"),
    service: v.string(),
    date: v.string(),
    patientId: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hôpital introuvable",
      });
    const appointmentId = await ctx.db.insert("hospitalAppointments", {
      hospitalId: args.hospitalId,
      hospitalName: hospital.name,
      service: args.service,
      date: args.date,
      patientId: args.patientId,
      patientName: (await ctx.db.get(args.patientId))?.name || "Patient",
      notes: args.notes,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { appointmentId };
  },
});

export const cancelHospitalAppointment = mutation({
  args: { appointmentId: v.id("hospitalAppointments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const apt = await ctx.db.get(args.appointmentId);
    if (!apt)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Rendez-vous introuvable",
      });
    if (apt.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await ctx.db.patch(args.appointmentId, { status: "cancelled" });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 19. TELECONSULTATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const createTeleconsultation = mutation({
  args: {
    doctorId: v.id("medicalProfessionals"),
    scheduledAt: v.string(),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Médecin introuvable",
      });
    const roomUrl = `https://telemed.example.com/room/${Date.now()}`;
    const id = await ctx.db.insert("teleconsultations", {
      doctorId: args.doctorId,
      patientId: user._id,
      scheduledAt: args.scheduledAt,
      status: "scheduled",
      durationMinutes: args.durationMinutes || 30,
      roomUrl,
      notes: args.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id, roomUrl };
  },
});

export const cancelTeleconsultation = mutation({
  args: { id: v.id("teleconsultations") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const tele = await ctx.db.get(args.id);
    if (!tele)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Téléconsultation introuvable",
      });
    if (tele.patientId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await ctx.db.patch(args.id, { status: "cancelled" });
  },
});

export const startTeleconsultation = mutation({
  args: { id: v.id("teleconsultations") },
  handler: async (ctx, args) => {
    const tele = await ctx.db.get(args.id);
    if (!tele)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Téléconsultation introuvable",
      });
    await ctx.db.patch(args.id, { status: "in-progress" });
    return { roomUrl: tele.roomUrl };
  },
});

export const completeTeleconsultation = mutation({
  args: { id: v.id("teleconsultations") },
  handler: async (ctx, args) => {
    const tele = await ctx.db.get(args.id);
    if (!tele)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Téléconsultation introuvable",
      });
    await ctx.db.patch(args.id, { status: "completed" });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. FITNESS, WELLNESS & NUTRITION
// ─────────────────────────────────────────────────────────────────────────────

export const getWorkoutHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("workoutSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const logWorkout = mutation({
  args: {
    name: v.string(),
    type: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("workoutSessions", { ...args, userId: user._id });
  },
});

export const getMeditationHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("meditationSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const logMeditation = mutation({
  args: {
    type: v.string(),
    durationMinutes: v.number(),
    date: v.string(),
    moodBefore: v.optional(v.number()),
    moodAfter: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("meditationSessions", { ...args, userId: user._id });
  },
});

export const upsertNutritionLog = mutation({
  args: {
    date: v.string(),
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
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("nutritionLogs")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert("nutritionLogs", { ...args, userId: user._id });
  },
});

export const getHealthSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const [workouts, meditations, appointments, metrics] = await Promise.all([
      ctx.db
        .query("workoutSessions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(7),
      ctx.db
        .query("meditationSessions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(7),
      ctx.db
        .query("medicalAppointments")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(5),
      ctx.db
        .query("healthMetrics")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(1),
    ]);
    return {
      workoutCount: workouts.length,
      totalWorkoutMinutes: workouts.reduce((s, w) => s + w.durationMinutes, 0),
      meditationCount: meditations.length,
      totalMeditationMinutes: meditations.reduce(
        (s, m) => s + m.durationMinutes,
        0,
      ),
      upcomingAppointments: appointments.filter((a) => a.status === "scheduled")
        .length,
      latestMetrics: metrics[0] ?? null,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 21. PATIENTS (UTILISATEURS)
// ─────────────────────────────────────────────────────────────────────────────

export const listPatients = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("users").collect();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 22. PHARMACY PRODUCTS (si besoin)
// ─────────────────────────────────────────────────────────────────────────────

export const getPharmacyProducts = query({
  args: { pharmacyId: v.id("pharmacies"), category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const pharmacy = await ctx.db.get(args.pharmacyId);
    if (!pharmacy) return [];
    let products = pharmacy.products || [];
    if (args.category) {
      products = products.filter((p) => p.category === args.category);
    }
    return products;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 23. TELECONSULTATIONS (GET)
// ─────────────────────────────────────────────────────────────────────────────

export const getTeleconsultations = query({
  args: {
    patientId: v.optional(v.id("users")),
    doctorId: v.optional(v.id("medicalProfessionals")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    let teleconsultations = await ctx.db.query("teleconsultations").collect();
    if (args.patientId) {
      teleconsultations = teleconsultations.filter(
        (t) => t.patientId === args.patientId,
      );
    } else if (args.doctorId) {
      teleconsultations = teleconsultations.filter(
        (t) => t.doctorId === args.doctorId,
      );
    } else {
      teleconsultations = teleconsultations.filter(
        (t) => t.patientId === user._id || (t.doctorId as any) === user._id,
      );
    }
    if (args.status) {
      teleconsultations = teleconsultations.filter(
        (t) => t.status === args.status,
      );
    }
    return teleconsultations;
  },
});

export const getTeleconsultation = query({
  args: { id: v.id("teleconsultations") },
  handler: async (ctx, args) => {
    const tele = await ctx.db.get(args.id);
    if (!tele)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Téléconsultation introuvable",
      });
    return tele;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 24. HEALTH METRICS (pour le suivi)
// ─────────────────────────────────────────────────────────────────────────────

export const getHealthMetrics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("healthMetrics")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 30);
  },
});

export const logHealthMetrics = mutation({
  args: {
    date: v.string(),
    weightKg: v.optional(v.number()),
    heartRateBpm: v.optional(v.number()),
    stepsCount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("healthMetrics", { ...args, userId: user._id });
  },
});
