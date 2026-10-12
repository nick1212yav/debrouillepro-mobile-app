import { mutation, query } from "../_generated/server";

// Mapping slug exact — identifiants stables ASCII
const CATEGORY_TO_SLUG: Record<string, string> = {
  Dépannage: "depannage",
  Éducation: "education",
  Beauté: "beaute",
  "Bien-être": "bien-etre",
  Livraison: "livraison",
  Photo: "photo",
};

// Regex déterministe sur les prix texte du seed
// "Dès 10k FCFA"    → 10000  XOF  fixed
// "Dès 8k/h FCFA"   → 8000   XOF  hourly
function parseLegacyPrice(raw: string): {
  basePrice: number | null;
  priceCurrency: string | null;
  pricingModel: "fixed" | "hourly" | "quote_only";
  billingUnit: string | null;
} {
  const text = raw.trim();
  const hourly = /\/\s*h/i.test(text);
  const match = text.match(/Dès\s+(\d+)\s*k\s*(?:\/\s*h)?\s*FCFA/i);

  if (match) {
    return {
      basePrice: parseInt(match[1], 10) * 1000,
      priceCurrency: "XOF",
      pricingModel: hourly ? "hourly" : "fixed",
      billingUnit: hourly ? "hour" : null,
    };
  }

  // Cas "200" USD (YAV / Voiture)
  const numeric = text.match(/^(\d+(?:[.,]\d+)?)$/);
  if (numeric) {
    return {
      basePrice: Math.round(parseFloat(numeric[1].replace(",", "."))),
      priceCurrency: "USD",
      pricingModel: "fixed",
      billingUnit: null,
    };
  }

  // Non parsable → quote_only, aucune valeur inventée
  return {
    basePrice: null,
    priceCurrency: null,
    pricingModel: "quote_only",
    billingUnit: null,
  };
}

function buildSearchText(p: {
  name: string;
  specialty: string;
  description: string;
  skills: string[];
  languages?: string[];
}): string {
  return [
    p.name,
    p.specialty,
    p.description,
    ...p.skills,
    ...(p.languages ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export const backfillProviders = mutation({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db.query("serviceProviders").collect();
    const categories = await ctx.db.query("serviceCategories").collect();

    const slugToId = new Map<string, (typeof categories)[number]["_id"]>();
    for (const c of categories) slugToId.set(c.slug, c._id);

    let migrated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const provider of providers) {
      // Déjà migré → on ne touche plus
      if (provider.migratedAt !== undefined) {
        skipped++;
        continue;
      }

      // Normalisation obligatoire avant recherche
      const name = (provider.name ?? "").replace(/\uFFFD/g, "");
      const specialty = (provider.specialty ?? "").replace(/\uFFFD/g, "");
      const description = (provider.description ?? "").replace(/\uFFFD/g, "");
      const location = (provider.location ?? "").replace(/\uFFFD/g, "");
      const categoryName = (provider.category ?? "").replace(/\uFFFD/g, "");

      // Patch des champs d'affichage corrompus si nécessaire
      const patch: Record<string, unknown> = {};

      if (name !== provider.name) patch.name = name;
      if (specialty !== provider.specialty) patch.specialty = specialty;
      if (description !== provider.description) patch.description = description;
      if (location !== provider.location) patch.location = location;
      if (categoryName !== provider.category) patch.category = categoryName;

      const slug = CATEGORY_TO_SLUG[categoryName];
      const categoryId = slug ? slugToId.get(slug) : undefined;
      if (categoryId) patch.categoryId = categoryId;

      // Prix structuré — aucune conversion de l'ancien champ `price`
      const parsed = parseLegacyPrice(provider.price);
      if (parsed.basePrice !== null) patch.basePrice = parsed.basePrice;
      if (parsed.priceCurrency !== null)
        patch.priceCurrency = parsed.priceCurrency;
      patch.pricingModel = parsed.pricingModel;
      if (parsed.billingUnit !== null) patch.billingUnit = parsed.billingUnit;

      // Statut et timestamps
      patch.status = "active";
      patch.createdAt = provider._creationTime;

      // Zones et flags
      patch.intervenesAtClientAddress = false;
      patch.intervenesAtProviderAddress = false;
      patch.intervenesOnline = false;

      // isDemo — décision explicite validée
      patch.isDemo = true;

      // searchText dénormalisé
      patch.searchText = buildSearchText({
        name,
        specialty,
        description,
        skills: provider.skills ?? [],
        languages: provider.languages,
      });

      patch.migratedAt = Date.now();

      try {
        await ctx.db.patch(provider._id, patch);
        migrated++;
      } catch (err) {
        errors.push(
          `${provider._id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    return {
      total: providers.length,
      migrated,
      skipped,
      errors,
    };
  },
});

export const auditProviders = query({
  args: {},
  handler: async (ctx) => {
    const providers = await ctx.db.query("serviceProviders").collect();
    return providers.map((p) => ({
      id: p._id,
      name: p.name,
      category: p.category,
      categoryId: p.categoryId ?? null,
      price: p.price,
      basePrice: p.basePrice ?? null,
      priceCurrency: p.priceCurrency ?? null,
      pricingModel: p.pricingModel ?? null,
      billingUnit: p.billingUnit ?? null,
      status: p.status ?? null,
      isDemo: p.isDemo ?? null,
      migratedAt: p.migratedAt ?? null,
      hasSearchText: Boolean(p.searchText),
    }));
  },
});
