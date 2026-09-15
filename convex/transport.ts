// convex/transport.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const db = ctx.db as any;
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  const user = await db
    .query("users")
    .withIndex("by_token", (q: any) =>
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

async function requireDriver(ctx: MutationCtx) {
  const user = await requireUser(ctx);
  if (!user.roles?.includes("driver"))
    throw new ConvexError({ code: "FORBIDDEN", message: "Chauffeur requis" });
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TRANSPORT ROUTES (annonces de trajets)
// ─────────────────────────────────────────────────────────────────────────────

export const listTransportRoutes = query({
  args: {
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    vehicleType: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    departureDate: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    let routes = await db.query("transportRoutes").collect();
    if (args.origin)
      routes = routes.filter((r: any) => r.origin === args.origin);
    if (args.destination)
      routes = routes.filter((r: any) => r.destination === args.destination);
    if (args.vehicleType)
      routes = routes.filter((r: any) => r.vehicleType === args.vehicleType);
    if (args.minPrice)
      routes = routes.filter((r: any) => r.pricePerSeat >= args.minPrice!);
    if (args.maxPrice)
      routes = routes.filter((r: any) => r.pricePerSeat <= args.maxPrice!);
    if (args.departureDate)
      routes = routes.filter((r: any) =>
        r.departureTime.startsWith(args.departureDate!),
      );
    if (args.search) {
      const s = args.search.toLowerCase();
      routes = routes.filter(
        (r: any) =>
          r.origin.toLowerCase().includes(s) ||
          r.destination.toLowerCase().includes(s) ||
          r.vehicleType.toLowerCase().includes(s),
      );
    }
    routes.sort((a: any, b: any) => a.pricePerSeat - b.pricePerSeat);
    if (args.limit) routes = routes.slice(0, args.limit);
    return routes;
  },
});

export const getTransportRoute = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const route = await db.get(args.id);
    if (!route)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Trajet introuvable",
      });
    return route;
  },
});

export const createTransportRoute = mutation({
  args: {
    // ---- Champs communs (Accepte toutes les catégories commerciales) ----
    vehicleType: v.union(
      v.literal("taxi"),
      v.literal("bus"),
      v.literal("moto"),
      v.literal("minibus"),
      v.literal("voiture"),
      v.literal("camion"),
      v.literal("rideshare"),
      v.literal("rental"),
      v.literal("courier"),
      v.literal("parcel"),
      v.literal("boat"),
      v.literal("flight"),
      v.literal("train"),
      v.literal("towtruck"),
      v.literal("ambulance"),
      v.literal("shuttle"),
    ),
    currency: v.string(),
    companyId: v.optional(v.string()),
    driverId: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    luggageAllowed: v.optional(v.boolean()),
    petsAllowed: v.optional(v.boolean()),
    accessibility: v.optional(v.boolean()),
    insuranceIncluded: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    status: v.optional(v.string()),

    // ---- Covoiturage / Bus ----
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    departureTime: v.optional(v.string()),
    seats: v.optional(v.number()),
    pricePerSeat: v.optional(v.number()),

    // ---- Taxi / Moto ----
    driverName: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehiclePlate: v.optional(v.string()),
    pricePerKm: v.optional(v.number()),

    // ---- Camion / Livraison ----
    capacity: v.optional(v.number()),
    weight: v.optional(v.number()),
    volume: v.optional(v.number()),

    // ---- Bus ----
    routeName: v.optional(v.string()),
    schedule: v.optional(v.string()),
    ticketPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);

    let companyId = args.companyId;

    // 1. Validation de l'existence du compte chauffeur dans transportDrivers
    const existingDriver = await db
      .query("transportDrivers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();

    if (!existingDriver && !companyId) {
      // Auto-création transparente du profil de conducteur si manquant
      await db.insert("transportDrivers", {
        userId: user._id,
        name: args.driverName || user.name || "Chauffeur",
        phone: args.phone || user.phone || "Non spécifié",
        city: args.city || "Kinshasa",
        country: "RDC",
        licenseNumber: "AUTO-VAL-" + Date.now(),
        licenseExpiry: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        vehicleModel: args.vehicleModel || "Modèle non spécifié",
        vehicleColor: "Non spécifiée",
        licensePlate: args.vehiclePlate || "N/A",
        vehicleType:
          args.vehicleType === "rideshare" || args.vehicleType === "rental"
            ? "voiture"
            : args.vehicleType === "courier"
              ? "moto"
              : "voiture",
        seats: args.seats || 4,
        available: true,
        rating: 5.0,
        reviewCount: 0,
        trips: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Traduction de la catégorie commerciale vers le véhicule physique autorisé par le schéma de la base
    let schemaVehicleType:
      | "taxi"
      | "bus"
      | "moto"
      | "minibus"
      | "voiture"
      | "camion"
      | "rideshare" = "voiture";
    const vt = args.vehicleType;
    if (vt === "taxi") schemaVehicleType = "taxi";
    else if (vt === "bus" || vt === "train") schemaVehicleType = "bus";
    else if (vt === "moto" || vt === "courier") schemaVehicleType = "moto";
    else if (vt === "minibus" || vt === "shuttle" || vt === "ambulance")
      schemaVehicleType = "minibus";
    else if (vt === "camion" || vt === "towtruck") schemaVehicleType = "camion";
    else if (vt === "rideshare") schemaVehicleType = "rideshare";
    else schemaVehicleType = "voiture"; // Fallbacks pour rental, parcel, boat, flight

    // 3. Alignement automatique du statut sur le modèle attendu
    const normalizedStatus =
      args.status === "active" ? "scheduled" : args.status || "scheduled";

    // 4. Construction du payload de trajet (avec valeurs par défaut rigoureuses)
    const routeData: any = {
      ...args,
      vehicleType: schemaVehicleType,
      driverId: user._id, // Associe l'ID de la table des utilisateurs
      companyId: companyId || undefined,

      // Fallbacks pour assurer la compatibilité avec un schéma strict qui exige v.string() ou v.number()
      origin: args.origin || "À la demande",
      destination: args.destination || "À la demande",
      departureTime: args.departureTime || "En service (Temps réel)",
      seats: args.seats || 1,
      seatsAvailable: args.seats || 1,
      pricePerSeat: args.pricePerSeat || args.ticketPrice || 0,

      status: normalizedStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ajustement de l'origine et destination pour les profils de proximité taxis/motos
    if (schemaVehicleType === "taxi" || schemaVehicleType === "moto") {
      routeData.origin = args.origin || "Service local (Zone d'activité)";
      routeData.destination =
        args.destination || "Service local (Zone d'activité)";
      routeData.departureTime = args.departureTime || "En service (Temps réel)";
    }

    // 5. Nettoyage de sécurité universel (retire les champs null/undefined pour v.optional)
    Object.keys(routeData).forEach((key) => {
      if (routeData[key] === null || routeData[key] === undefined) {
        delete routeData[key];
      }
    });

    return db.insert("transportRoutes", routeData);
  },
});

export const updateTransportRoute = mutation({
  args: {
    id: v.string(),
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    departureTime: v.optional(v.string()),
    vehicleType: v.optional(
      v.union(
        v.literal("taxi"),
        v.literal("bus"),
        v.literal("moto"),
        v.literal("minibus"),
        v.literal("voiture"),
        v.literal("camion"),
      ),
    ),
    seats: v.optional(v.number()),
    pricePerSeat: v.optional(v.number()),
    currency: v.optional(v.string()),
    companyId: v.optional(v.string()),
    driverId: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    luggageAllowed: v.optional(v.boolean()),
    petsAllowed: v.optional(v.boolean()),
    accessibility: v.optional(v.boolean()),
    insuranceIncluded: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("cancelled"),
        v.literal("completed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const route = await db.get(args.id);
    if (!route)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Trajet introuvable",
      });
    if (!user.roles?.includes("admin")) {
      if (route.driverId) {
        const driver = await db.get(route.driverId);
        if (driver?.userId !== user._id)
          throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      } else {
        throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      }
    }
    const { id, ...updates } = args;
    await db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

export const deleteTransportRoute = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const route = await db.get(args.id);
    if (!route)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Trajet introuvable",
      });
    if (!user.roles?.includes("admin")) {
      if (route.driverId) {
        const driver = await db.get(route.driverId);
        if (driver?.userId !== user._id)
          throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      } else {
        throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      }
    }
    await db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TRANSPORT BOOKINGS (réservations)
// ─────────────────────────────────────────────────────────────────────────────

export const listTransportBookings = query({
  args: {
    userId: v.optional(v.string()),
    driverId: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    let bookings = await db.query("transportBookings").collect();
    if (args.userId)
      bookings = bookings.filter((b: any) => b.userId === args.userId);
    else if (args.driverId)
      bookings = bookings.filter((b: any) => b.driverId === args.driverId);
    else bookings = bookings.filter((b: any) => b.userId === user._id);
    if (args.status)
      bookings = bookings.filter((b: any) => b.status === args.status);
    bookings.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (args.limit) bookings = bookings.slice(0, args.limit);
    return bookings;
  },
});

export const getTransportBooking = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const booking = await db.get(args.id);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    const user = await requireUser(ctx);
    if (booking.userId !== user._id && !user.roles?.includes("admin")) {
      if (booking.driverId) {
        const driver = await db.get(booking.driverId);
        if (driver?.userId !== user._id)
          throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      } else {
        throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
      }
    }
    return booking;
  },
});

export const bookTransportRoute = mutation({
  args: {
    routeId: v.string(),
    seats: v.number(),
    origin: v.optional(v.string()),
    destination: v.optional(v.string()),
    departureTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const route = await db.get(args.routeId);
    if (!route)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Trajet introuvable",
      });
    if (route.seatsAvailable < args.seats)
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Nombre de places insuffisant",
      });
    if (
      route.status !== "active" &&
      route.status !== "scheduled" &&
      route.status !== "in_progress"
    )
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Ce trajet n'est plus disponible",
      });
    const totalAmount = route.pricePerSeat * args.seats;
    const bookingId = await db.insert("transportBookings", {
      routeId: route._id,
      userId: user._id,
      driverId: route.driverId || null,
      companyId: route.companyId || null,
      seats: args.seats,
      totalAmount,
      currency: route.currency,
      status: "confirmed",
      origin: args.origin || route.origin,
      destination: args.destination || route.destination,
      departureTime: args.departureTime || route.departureTime,
      notes: args.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db.patch(route._id, {
      seatsAvailable: route.seatsAvailable - args.seats,
      updatedAt: new Date().toISOString(),
    });
    return { bookingId };
  },
});

export const cancelTransportBooking = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const booking = await db.get(args.id);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    if (booking.userId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    if (booking.status === "cancelled" || booking.status === "completed")
      throw new ConvexError({
        code: "INVALID_STATE",
        message:
          "Impossible d'annuler une réservation déjà terminée ou annulée",
      });
    await db.patch(args.id, { status: "cancelled" });
    const route = await db.get(booking.routeId);
    if (route) {
      await db.patch(route._id, {
        seatsAvailable: route.seatsAvailable + booking.seats,
        updatedAt: new Date().toISOString(),
      });
    }
  },
});

export const completeTransportBooking = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const booking = await db.get(args.id);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    if (booking.driverId) {
      const driver = await db.get(booking.driverId);
      if (driver?.userId !== user._id && !user.roles?.includes("admin"))
        throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    } else {
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }
    if (booking.status === "cancelled")
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Impossible de terminer une réservation annulée",
      });
    await db.patch(args.id, { status: "completed" });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. TRANSPORT DRIVERS (chauffeurs)
// ─────────────────────────────────────────────────────────────────────────────

export const listTransportDrivers = query({
  args: {
    city: v.optional(v.string()),
    available: v.optional(v.boolean()),
    minRating: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    let drivers = await db.query("transportDrivers").collect();
    if (args.city) drivers = drivers.filter((d: any) => d.city === args.city);
    if (args.available !== undefined)
      drivers = drivers.filter((d: any) => d.available === args.available);
    if (args.minRating)
      drivers = drivers.filter((d: any) => d.rating >= args.minRating!);
    if (args.search) {
      const s = args.search.toLowerCase();
      drivers = drivers.filter(
        (d: any) =>
          d.name.toLowerCase().includes(s) ||
          d.vehicleModel.toLowerCase().includes(s) ||
          d.licensePlate.toLowerCase().includes(s),
      );
    }
    drivers.sort((a: any, b: any) => b.rating - a.rating);
    if (args.limit) drivers = drivers.slice(0, args.limit);
    return drivers;
  },
});

export const getTransportDriver = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const driver = await db.get(args.id);
    if (!driver)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Chauffeur introuvable",
      });
    return driver;
  },
});

export const createTransportDriver = mutation({
  args: {
    userId: v.string(),
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
    rating: v.optional(v.number()),
    bio: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    documents: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    if (args.userId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({
        code: "FORBIDDEN",
        message:
          "Vous ne pouvez créer un chauffeur que pour vous-même ou en tant qu'admin",
      });
    return db.insert("transportDrivers", {
      ...args,
      rating: args.rating ?? 0,
      reviewCount: 0,
      trips: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateTransportDriver = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    licenseExpiry: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehicleColor: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
    vehicleType: v.optional(
      v.union(
        v.literal("taxi"),
        v.literal("bus"),
        v.literal("moto"),
        v.literal("minibus"),
        v.literal("voiture"),
        v.literal("camion"),
      ),
    ),
    seats: v.optional(v.number()),
    available: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    bio: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    documents: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    companyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const driver = await db.get(args.id);
    if (!driver)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Chauffeur introuvable",
      });
    if (driver.userId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...updates } = args;
    await db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

export const deleteTransportDriver = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const driver = await db.get(args.id);
    if (!driver)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Chauffeur introuvable",
      });
    if (driver.userId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRANSPORT COMPANIES (sociétés de transport)
// ─────────────────────────────────────────────────────────────────────────────

export const listTransportCompanies = query({
  args: {
    city: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    let companies = await db.query("transportCompanies").collect();
    if (args.city)
      companies = companies.filter((c: any) => c.city === args.city);
    if (args.search) {
      const s = args.search.toLowerCase();
      companies = companies.filter((c: any) =>
        c.name.toLowerCase().includes(s),
      );
    }
    if (args.limit) companies = companies.slice(0, args.limit);
    return companies;
  },
});

export const getTransportCompany = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const company = await db.get(args.id);
    if (!company)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Société introuvable",
      });
    return company;
  },
});

export const createTransportCompany = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    vehicleTypes: v.array(v.string()),
    fleetSize: v.number(),
    rating: v.optional(v.number()),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    if (!user.roles?.includes("admin") && !user.roles?.includes("company"))
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul un admin ou une société peut créer une société",
      });
    return db.insert("transportCompanies", {
      ...args,
      rating: args.rating ?? 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateTransportCompany = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    vehicleTypes: v.optional(v.array(v.string())),
    fleetSize: v.optional(v.number()),
    rating: v.optional(v.number()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const company = await db.get(args.id);
    if (!company)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Société introuvable",
      });
    if (!user.roles?.includes("admin") && !user.roles?.includes("company"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...updates } = args;
    await db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

export const deleteTransportCompany = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const company = await db.get(args.id);
    if (!company)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Société introuvable",
      });
    if (!user.roles?.includes("admin") && !user.roles?.includes("company"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. REVIEWS (avis)
// ─────────────────────────────────────────────────────────────────────────────

export const getTransportReviews = query({
  args: { driverId: v.optional(v.string()), companyId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    if (args.driverId) {
      return db
        .query("transportReviews")
        .withIndex("by_driver", (q: any) => q.eq("driverId", args.driverId!))
        .collect();
    } else if (args.companyId) {
      return db
        .query("transportReviews")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId!))
        .collect();
    } else {
      return [];
    }
  },
});

export const addTransportReview = mutation({
  args: {
    driverId: v.optional(v.string()),
    companyId: v.optional(v.string()),
    rating: v.number(),
    comment: v.string(),
    bookingId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    if (!args.driverId && !args.companyId)
      throw new ConvexError({
        code: "INVALID_ARGS",
        message: "Il faut spécifier un chauffeur ou une société",
      });
    const reviewId = await db.insert("transportReviews", {
      driverId: args.driverId || null,
      companyId: args.companyId || null,
      userId: user._id,
      userName: user.name || "Anonyme",
      rating: args.rating,
      comment: args.comment,
      bookingId: args.bookingId || null,
      date: new Date().toISOString(),
      likes: 0,
      helpful: 0,
      status: "published",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (args.driverId) {
      const reviews = await db
        .query("transportReviews")
        .withIndex("by_driver", (q: any) => q.eq("driverId", args.driverId!))
        .collect();
      const avg =
        reviews.reduce((s: any, r: any) => s + r.rating, 0) / reviews.length;
      await db.patch(args.driverId, {
        rating: avg,
        reviewCount: reviews.length,
      });
    }
    if (args.companyId) {
      const reviews = await db
        .query("transportReviews")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId!))
        .collect();
      const avg =
        reviews.reduce((s: any, r: any) => s + r.rating, 0) / reviews.length;
      await db.patch(args.companyId, {
        rating: avg,
        reviewCount: reviews.length,
      });
    }
    return reviewId;
  },
});

export const likeTransportReview = mutation({
  args: { reviewId: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const review = await db.get(args.reviewId);
    if (!review)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Avis introuvable",
      });
    await db.patch(args.reviewId, { likes: review.likes + 1 });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. QUESTIONS (FAQ)
// ─────────────────────────────────────────────────────────────────────────────

export const getTransportQuestions = query({
  args: { driverId: v.optional(v.string()), companyId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    if (args.driverId) {
      return db
        .query("transportQuestions")
        .withIndex("by_driver", (q: any) => q.eq("driverId", args.driverId!))
        .collect();
    } else if (args.companyId) {
      return db
        .query("transportQuestions")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId!))
        .collect();
    } else {
      return [];
    }
  },
});

export const askTransportQuestion = mutation({
  args: {
    driverId: v.optional(v.string()),
    companyId: v.optional(v.string()),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    if (!args.driverId && !args.companyId)
      throw new ConvexError({
        code: "INVALID_ARGS",
        message: "Il faut spécifier un chauffeur ou une société",
      });
    return db.insert("transportQuestions", {
      driverId: args.driverId || null,
      companyId: args.companyId || null,
      userId: user._id,
      userName: user.name || "Anonyme",
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

export const answerTransportQuestion = mutation({
  args: {
    questionId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const question = await db.get(args.questionId);
    if (!question)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Question introuvable",
      });
    let authorized = false;
    if (question.driverId) {
      const driver = await db.get(question.driverId);
      if (driver?.userId === user._id) authorized = true;
    }
    if (question.companyId) {
      const company = await db.get(question.companyId);
      if (company?.userId === user._id) authorized = true;
    }
    if (!authorized && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const answer = {
      id: `ans_${Date.now()}`,
      authorId: user._id,
      author: user.name || "Réponse",
      content: args.content,
      date: new Date().toISOString(),
      likes: 0,
    };
    const answers = [...(question.answers || []), answer];
    await db.patch(args.questionId, {
      answers,
      status: "answered",
      updatedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. PAYMENTS (paiements)
// ─────────────────────────────────────────────────────────────────────────────

export const processTransportPayment = mutation({
  args: {
    bookingId: v.string(),
    amount: v.number(),
    currency: v.string(),
    method: v.string(),
    provider: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const booking = await db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    if (booking.userId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const transactionId = `tx_${Date.now()}`;
    await db.insert("transportPayments", {
      bookingId: args.bookingId,
      userId: user._id,
      amount: args.amount,
      currency: args.currency,
      method: args.method,
      provider: args.provider || null,
      status: "pending",
      transactionId,
      metadata: args.metadata || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await db.patch(args.bookingId, {
      paymentStatus: "pending",
      updatedAt: new Date().toISOString(),
    });
    return { transactionId };
  },
});

export const confirmTransportPayment = mutation({
  args: { transactionId: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const payment = await db
      .query("transportPayments")
      .withIndex("by_transaction", (q: any) =>
        q.eq("transactionId", args.transactionId),
      )
      .unique();
    if (!payment)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Paiement introuvable",
      });
    if (payment.userId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await db.patch(payment._id, { status: "completed" });
    const booking = await db.get(payment.bookingId);
    if (booking) {
      await db.patch(booking._id, {
        paymentStatus: "completed",
        updatedAt: new Date().toISOString(),
      });
    }
  },
});

export const getTransportPaymentStatus = query({
  args: { bookingId: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const payment = await db
      .query("transportPayments")
      .withIndex("by_booking", (q: any) => q.eq("bookingId", args.bookingId))
      .unique();
    if (!payment) return null;
    if (payment.userId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    return payment;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. TRACKING (suivi en temps réel)
// ─────────────────────────────────────────────────────────────────────────────

export const updateTransportLocation = mutation({
  args: {
    bookingId: v.string(),
    lat: v.number(),
    lng: v.number(),
    speed: v.optional(v.number()),
    heading: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const booking = await db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    let authorized = false;
    if (booking.driverId) {
      const driver = await db.get(booking.driverId);
      if (driver?.userId === user._id) authorized = true;
    }
    if (!authorized && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await db.insert("transportTracking", {
      bookingId: args.bookingId,
      lat: args.lat,
      lng: args.lng,
      speed: args.speed || null,
      heading: args.heading || null,
      timestamp: new Date().toISOString(),
    });
    await db.patch(args.bookingId, {
      lastLat: args.lat,
      lastLng: args.lng,
      lastUpdate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const getTransportTracking = query({
  args: { bookingId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const booking = await db.get(args.bookingId);
    if (!booking)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    if (booking.userId !== user._id && !user.roles?.includes("admin")) {
      let authorized = false;
      if (booking.driverId) {
        const driver = await db.get(booking.driverId);
        if (driver?.userId === user._id) authorized = true;
      }
      if (!authorized)
        throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    }
    const tracking = await db
      .query("transportTracking")
      .withIndex("by_booking", (q: any) => q.eq("bookingId", args.bookingId))
      .order("desc")
      .take(args.limit ?? 100);
    return tracking;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. FLEET MANAGEMENT (pour les entreprises)
// ─────────────────────────────────────────────────────────────────────────────

export const listTransportVehicles = query({
  args: {
    companyId: v.optional(v.string()),
    available: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    let vehicles = await db.query("transportVehicles").collect();
    if (args.companyId)
      vehicles = vehicles.filter((v: any) => v.companyId === args.companyId);
    if (args.available !== undefined)
      vehicles = vehicles.filter((v: any) => v.available === args.available);
    if (args.limit) vehicles = vehicles.slice(0, args.limit);
    return vehicles;
  },
});

export const createTransportVehicle = mutation({
  args: {
    companyId: v.string(),
    model: v.string(),
    licensePlate: v.string(),
    color: v.string(),
    type: v.union(
      v.literal("taxi"),
      v.literal("bus"),
      v.literal("moto"),
      v.literal("minibus"),
      v.literal("voiture"),
      v.literal("camion"),
    ),
    seats: v.number(),
    available: v.boolean(),
    maintenanceDue: v.optional(v.string()),
    insuranceExpiry: v.optional(v.string()),
    documents: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const company = await db.get(args.companyId);
    if (!company)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Société introuvable",
      });
    if (!user.roles?.includes("admin") && !user.roles?.includes("company"))
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    return db.insert("transportVehicles", {
      ...args,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const updateTransportVehicle = mutation({
  args: {
    id: v.string(),
    model: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("taxi"),
        v.literal("bus"),
        v.literal("moto"),
        v.literal("minibus"),
        v.literal("voiture"),
        v.literal("camion"),
      ),
    ),
    seats: v.optional(v.number()),
    available: v.optional(v.boolean()),
    maintenanceDue: v.optional(v.string()),
    insuranceExpiry: v.optional(v.string()),
    documents: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const vehicle = await db.get(args.id);
    if (!vehicle)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Véhicule introuvable",
      });
    const company = await db.get(vehicle.companyId);
    if (!company)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Société introuvable",
      });
    if (!user.roles?.includes("admin") && !user.roles?.includes("company"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const { id, ...updates } = args;
    await db.patch(id, { ...updates, updatedAt: new Date().toISOString() });
  },
});

export const deleteTransportVehicle = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const vehicle = await db.get(args.id);
    if (!vehicle)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Véhicule introuvable",
      });
    const company = await db.get(vehicle.companyId);
    if (!company)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Société introuvable",
      });
    if (!user.roles?.includes("admin") && !user.roles?.includes("company"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    await db.delete(args.id);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. STATISTIQUES ET MÉTRIQUES
// ─────────────────────────────────────────────────────────────────────────────

export const getTransportStats = query({
  args: {},
  handler: async (ctx) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    const [bookings, routes, drivers, companies] = await Promise.all([
      db.query("transportBookings").collect(),
      db.query("transportRoutes").collect(),
      db.query("transportDrivers").collect(),
      db.query("transportCompanies").collect(),
    ]);
    const userBookings = bookings.filter((b: any) => b.userId === user._id);
    const totalSpent = userBookings.reduce(
      (s: any, b: any) => s + b.totalAmount,
      0,
    );
    return {
      totalBookings: userBookings.length,
      totalSpent,
      upcomingBookings: userBookings.filter(
        (b: any) => b.status === "confirmed" || b.status === "pending",
      ).length,
      completedBookings: userBookings.filter(
        (b: any) => b.status === "completed",
      ).length,
      cancelledBookings: userBookings.filter(
        (b: any) => b.status === "cancelled",
      ).length,
      globalStats: {
        totalRoutes: routes.length,
        totalDrivers: drivers.length,
        totalCompanies: companies.length,
        activeRoutes: routes.filter(
          (r: any) =>
            r.status === "active" ||
            r.status === "scheduled" ||
            r.status === "in_progress",
        ).length,
      },
    };
  },
});

export const getDriverStats = query({
  args: { driverId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const user = await requireUser(ctx);
    let driverId = args.driverId;
    if (!driverId) {
      const driver = await db
        .query("transportDrivers")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .unique();
      if (!driver)
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Chauffeur introuvable",
        });
      driverId = driver._id;
    }
    const driver = await db.get(driverId);
    if (!driver)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Chauffeur introuvable",
      });
    if (driver.userId !== user._id && !user.roles?.includes("admin"))
      throw new ConvexError({ code: "FORBIDDEN", message: "Non autorisé" });
    const bookings = await db
      .query("transportBookings")
      .withIndex("by_driver", (q: any) => q.eq("driverId", driverId))
      .collect();
    const completed = bookings.filter((b: any) => b.status === "completed");
    const revenue = completed.reduce((s: any, b: any) => s + b.totalAmount, 0);
    return {
      driver,
      totalTrips: bookings.length,
      completedTrips: completed.length,
      revenue,
      rating: driver.rating,
      reviewCount: driver.reviewCount,
    };
  },
});
