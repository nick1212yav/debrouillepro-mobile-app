import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Carte — données géographiques des publications actives.
 *
 * Principes :
 * - uniquement des publications actives ;
 * - uniquement des publications possédant de vraies coordonnées ;
 * - filtrage par type côté serveur ;
 * - filtrage géographique par rayon côté serveur ;
 * - aucune donnée fictive ;
 * - aucune image inutile dans la réponse ;
 * - réponse légère destinée à la carte native.
 */

const DEFAULT_RADIUS_KM = 25;
const MAX_RADIUS_KM = 100;
const MAX_RESULTS = 250;

const EARTH_RADIUS_KM = 6371;

type GeoCenter = {
  lat: number;
  lng: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function normalizeRadius(radiusKm: number | undefined): number {
  if (radiusKm == null || !Number.isFinite(radiusKm)) {
    return DEFAULT_RADIUS_KM;
  }

  return Math.min(MAX_RADIUS_KM, Math.max(1, radiusKm));
}

function getCenter(
  lat: number | undefined,
  lng: number | undefined,
): GeoCenter | null {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return {
    lat,
    lng,
  };
}

export const listGeoPublications = query({
  args: {
    types: v.optional(v.array(v.string())),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const center = getCenter(args.lat, args.lng);
    const radiusKm = normalizeRadius(args.radiusKm);

    const requestedTypes =
      args.types && args.types.length > 0 ? new Set(args.types) : null;

    const rows = await ctx.db
      .query("publications")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(MAX_RESULTS);

    const geoRows = rows.filter((publication) => {
      const latitude = publication.latitude;
      const longitude = publication.longitude;

      if (latitude == null || longitude == null) {
        return false;
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return false;
      }

      if (requestedTypes && !requestedTypes.has(publication.type)) {
        return false;
      }

      if (center == null) {
        return true;
      }

      const distance = distanceKm(center.lat, center.lng, latitude, longitude);

      return distance <= radiusKm;
    });

    const result = await Promise.all(
      geoRows.map(async (publication) => {
        const author = await ctx.db.get(publication.authorId);

        const latitude = publication.latitude;
        const longitude = publication.longitude;

        // geoRows garantit que ces deux valeurs existent
        // et sont des nombres finis.
        if (
          latitude == null ||
          longitude == null ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        const distance =
          center == null
            ? undefined
            : distanceKm(center.lat, center.lng, latitude, longitude);

        return {
          _id: publication._id,
          type: publication.type,
          title: publication.title,
          description: publication.description,
          price: publication.price,
          location: publication.location,
          latitude,
          longitude,
          likeCount: publication.likeCount,
          commentCount: publication.commentCount,
          authorName: author?.name ?? "Anonyme",
          authorAvatar: author?.avatar,
          distanceKm:
            distance != null ? Math.round(distance * 10) / 10 : undefined,
        };
      }),
    );

    const validResult = result.filter(
      (publication): publication is NonNullable<typeof publication> =>
        publication !== null,
    );

    if (center != null) {
      validResult.sort((a, b) => {
        const distanceA = a.distanceKm ?? Number.POSITIVE_INFINITY;

        const distanceB = b.distanceKm ?? Number.POSITIVE_INFINITY;

        return distanceA - distanceB;
      });
    }

    return validResult;
  },
});
