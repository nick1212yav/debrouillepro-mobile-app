export function formatTime(creationTime: number): string {
  const now = Date.now();
  const diff = now - creationTime;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return `${Math.floor(days / 7)}sem`;
}

export function parseMeta(meta: string | undefined): any {
  if (!meta) return {};
  try {
    return JSON.parse(meta);
  } catch {
    return {};
  }
}

export function getModuleEmoji(type: string): string {
  const emojis: Record<string, string> = {
    job: "💼",
    emploi: "💼",
    immo: "🏠",
    logement: "🏠",
    service: "🛒",
    evenement: "📅",
    community: "👥",
    agri: "🌾",
    sante: "🏥",
    transport: "🚗",
    annonce: "📢",
    restauration: "🍽️",
    hebergement: "🏨",
    energie: "⚡",
    ong: "🤝",
    media: "📺",
    video: "🎬",
    article: "📝",
    sondage: "📊",
    justice: "⚖️",
    voyages: "✈️",
    education: "🎓",
    finance: "💰",
    creator: "⭐",
    network: "🔗",
    business: "🏢",
    tourisme: "🌍",
    sport: "⚽",
    culture: "🎭",
    tech: "💻",
    environnement: "🌿",
    marketplace: "🛍️",
    premium: "👑",
    boost: "⚡",
    reputation: "🏅",
    recompenses: "🏆",
    parrainage: "🤝",
    sos: "🆘",
  };
  return emojis[type] || "📄";
}
