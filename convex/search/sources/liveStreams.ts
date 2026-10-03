// convex/search/sources/liveStreams.ts

import type { RawSearchHit, SourceAdapter } from "../types";

export const liveStreamsSource: SourceAdapter = {
  id: "liveStreams",
  domain: "live",

  async search(ctx, intent, term, limit): Promise<RawSearchHit[]> {
    const q = term.trim();
    if (!q) return [];

    // On cherche à la fois les lives actifs et les replays terminés.
    const [live, ended] = await Promise.all([
      ctx.db
        .query("liveStreams")
        .withSearchIndex("search_title", (s: any) =>
          s.search("title", q).eq("status", "live"),
        )
        .take(limit),

      ctx.db
        .query("liveStreams")
        .withSearchIndex("search_title", (s: any) =>
          s.search("title", q).eq("status", "ended"),
        )
        .take(limit),
    ]);

    const merged = [...live, ...ended].slice(0, limit);

    return merged.map((d: any): RawSearchHit => {
      const isLive = d.status === "live";

      return {
        id: `live-${d._id}`,
        title: d.title ?? "Live",
        subtitle: d.category ?? "Diffusion",
        meta: isLive ? "EN DIRECT" : "Replay",
        badge: isLive ? "LIVE" : "REPLAY",
        badgeColor: isLive ? "#F87171" : "#818CF8",
        route: "live-streaming",
        fields: {
          title: d.title ?? "",
          description: d.description,
          category: d.category,
          city: d.city,
        },
      };
    });
  },
};
