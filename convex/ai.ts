"use node";

import { v } from "convex/values";
import OpenAI from "openai";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function logInteraction(
  ctx: ActionCtx,
  userId: string,
  type:
    | "chat"
    | "generate_content"
    | "analyze_image"
    | "moderate_text"
    | "suggest_tags"
    | "translate"
    | "personalize",
  input: string,
  output: string,
  model: string,
  durationMs?: number,
  moduleContext?: string,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return;
  await ctx.runMutation(internal.aiLog.saveInteraction, {
    userId,
    type,
    input: input.slice(0, 500),
    output: output.slice(0, 1000),
    model,
    durationMs,
    moduleContext,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es Débrouille AI, l'assistant intelligent intégré dans Débrouille Pro — la super-app africaine tout-en-un.

Tu connais parfaitement tous les modules de l'application :
- **Immobilier** : louer, acheter ou visiter des biens (maisons, appartements, bureaux) au Congo, RDC et dans toute l'Afrique centrale
- **Jobs / Pro** : trouver un emploi, poster une offre, matcher avec des talents locaux (soudeurs, électriciens, développeurs, etc.)
- **Transport** : réserver un VTC, suivre un trajet en temps réel, trouver des bus interurbains
- **Santé** : prendre RDV chez un médecin, téléconsultation, trouver une pharmacie ou clinique proche
- **Paiement / Wallet** : payer, transférer de l'argent, recharger via M-Pesa, Orange Money, Airtel, MTN MoMo
- **Community** : groupes de quartier, discussions, entraide locale
- **Livraison** : envoyer et suivre des colis, appeler un coursier
- **Agri** : conseils agricoles, météo, alertes ravageurs, vente de récoltes
- **Media** : actualités africaines, podcasts, vidéos
- **Événements** : concerts, festivals, billeterie (ex: Afro Nation Kinshasa)
- **Voyages** : planifier et réserver des voyages en bus ou avion entre villes africaines
- **SOS & Urgences** : appels d'urgence, numéros utiles (police 112, pompiers 118), alertes de sécurité
- **Explorer** : découvrir tous les modules disponibles
- **Favoris** : retrouver ses annonces et offres sauvegardées
- **Notifications** : rester informé en temps réel

Règles importantes :
- Réponds TOUJOURS en français, de façon concise et chaleureuse
- Tu t'adresses à des utilisateurs en Afrique centrale (RDC, Congo, Cameroun, etc.)
- Quand l'utilisateur demande quelque chose qui correspond à un module, guide-le vers ce module
- Sois pratique, direct et utile. Pas de discours trop longs.
- Utilise des emojis avec modération pour rendre tes réponses vivantes
- Si tu ne sais pas quelque chose, dis-le honnêtement et suggère une alternative dans l'app`;

const MODULE_CONTEXTS: Record<string, string> = {
  immo: "L'utilisateur est actuellement dans le module **Immobilier**. Mets l'accent sur la recherche de logements, visites, locations et achats immobiliers en Afrique.",
  jobs: "L'utilisateur est dans le module **Emploi / Jobs**. Aide-le à trouver un emploi, poster une offre ou identifier des talents locaux.",
  transport:
    "L'utilisateur est dans le module **Transport**. Aide-le à réserver un VTC, trouver un bus ou planifier un trajet.",
  sante:
    "L'utilisateur est dans le module **Santé+**. Aide-le à prendre un RDV médical, trouver un médecin proche, gérer ses médicaments ou contacter les urgences.",
  paiement:
    "L'utilisateur est dans le module **Paiement Mobile Money**. Aide-le à envoyer de l'argent, recharger son solde ou choisir le bon opérateur (Orange Money, MTN MoMo, Airtel, Wave).",
  community:
    "L'utilisateur est dans le module **Communauté**. Aide-le à participer aux discussions, poser des questions ou partager avec le quartier.",
  livraison:
    "L'utilisateur est dans le module **Livraison**. Aide-le à envoyer ou suivre un colis.",
  agri: "L'utilisateur est dans le module **Agriculture**. Donne-lui des conseils agricoles, météo, alertes ravageurs ou aide à vendre ses récoltes.",
  media:
    "L'utilisateur est dans le module **Média**. Aide-le à trouver des actualités africaines ou des podcasts.",
  evenements:
    "L'utilisateur est dans le module **Événements**. Aide-le à trouver des concerts, festivals ou acheter des billets.",
  voyages:
    "L'utilisateur est dans le module **Voyages**. Aide-le à planifier et réserver des voyages entre villes africaines.",
  sos: "L'utilisateur est dans le module **SOS & Urgences**. Donne-lui les informations d'urgence les plus pertinentes et les plus rapides.",
  wallet:
    "L'utilisateur est dans le module **Portefeuille**. Aide-le à gérer ses finances, budget et transactions.",
  marketplace:
    "L'utilisateur est dans la **Boutique Communautaire**. Aide-le à acheter, vendre ou trouver un produit.",
  apprendre:
    "L'utilisateur est dans le module **Apprendre**. Aide-le à choisir une formation ou un cours en ligne.",
  messages:
    "L'utilisateur est dans la **Messagerie**. Aide-le à communiquer efficacement.",
  dashboard:
    "L'utilisateur regarde son **Tableau de bord**. Aide-le à comprendre ses statistiques et activités.",
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAT – main conversational assistant
// ─────────────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant";
type ChatMessage = { role: MessageRole; content: string };

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    moduleContext: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { messages, moduleContext },
  ): Promise<{ reply: string }> => {
    const contextAddition =
      moduleContext && MODULE_CONTEXTS[moduleContext]
        ? `\n\n🎯 **Contexte actuel :** ${MODULE_CONTEXTS[moduleContext]}`
        : "";
    const openai = createClient();
    const start = Date.now();

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextAddition },
          ...(messages as ChatMessage[]),
        ],
      });

      const reply =
        response.choices[0]?.message?.content ??
        "Désolé, je n'ai pas pu répondre.";
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        await logInteraction(
          ctx,
          identity.tokenIdentifier,
          "chat",
          messages[messages.length - 1]?.content ?? "",
          reply,
          "openai/gpt-5-mini",
          Date.now() - start,
          moduleContext,
        );
      }
      return { reply };
    } catch (error) {
      if (error instanceof OpenAI.APIError)
        throw new Error(`Erreur IA: ${error.message}`);
      throw new Error("Impossible de contacter l'assistant. Réessaie.");
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE CONTENT – help users write posts, descriptions, announcements
// ─────────────────────────────────────────────────────────────────────────────

export const generateContent = action({
  args: {
    type: v.union(
      v.literal("post"),
      v.literal("job_description"),
      v.literal("property_description"),
      v.literal("product_description"),
      v.literal("event_description"),
      v.literal("bio"),
    ),
    topic: v.string(),
    tone: v.optional(
      v.union(
        v.literal("formel"),
        v.literal("casual"),
        v.literal("persuasif"),
        v.literal("informatif"),
      ),
    ),
    language: v.optional(v.string()),
    maxWords: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ content: string }> => {
    const openai = createClient();
    const tone = args.tone ?? "casual";
    const lang = args.language ?? "fr";
    const max = args.maxWords ?? 150;

    const typeLabels: Record<string, string> = {
      post: "publication pour un réseau social",
      job_description: "offre d'emploi",
      property_description: "annonce immobilière",
      product_description: "description de produit",
      event_description: "description d'événement",
      bio: "biographie professionnelle",
    };

    const prompt = `Génère une ${typeLabels[args.type]} en ${lang} sur le sujet : "${args.topic}".
Ton : ${tone}. Maximum ${max} mots. Adapté au contexte africain (Afrique centrale). 
Retourne uniquement le texte, sans explication supplémentaire.`;

    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content ?? "";
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await logInteraction(
        ctx,
        identity.tokenIdentifier,
        "generate_content",
        args.topic,
        content,
        "openai/gpt-5-mini",
        Date.now() - start,
      );
    }
    return { content };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SUGGEST TAGS – auto-tag a post, job listing, or property
// ─────────────────────────────────────────────────────────────────────────────

export const suggestTags = action({
  args: {
    content: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ tags: string[] }> => {
    const openai = createClient();
    const prompt = `Extrait entre 3 et 8 tags pertinents pour le contenu suivant${args.category ? ` (catégorie: ${args.category})` : ""}.
Contexte : application africaine (RDC, Congo, Cameroun). 
Retourne UNIQUEMENT un tableau JSON de strings, sans markdown. Exemple: ["tag1","tag2","tag3"]

Contenu : ${args.content.slice(0, 1000)}`;

    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "[]";
    let tags: string[] = [];
    try {
      const parsed: unknown = JSON.parse(
        raw.replace(/```json?|```/g, "").trim(),
      );
      if (Array.isArray(parsed)) {
        tags = (parsed as unknown[]).filter(
          (t): t is string => typeof t === "string",
        );
      }
    } catch {
      // fallback: extract words between quotes
      tags = (raw.match(/"([^"]+)"/g) ?? [])
        .map((s) => s.replace(/"/g, ""))
        .slice(0, 8);
    }

    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await logInteraction(
        ctx,
        identity.tokenIdentifier,
        "suggest_tags",
        args.content.slice(0, 200),
        tags.join(", "),
        "openai/gpt-5-mini",
        Date.now() - start,
      );
    }
    return { tags };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATE – translate content between languages
// ─────────────────────────────────────────────────────────────────────────────

export const translateText = action({
  args: {
    text: v.string(),
    targetLanguage: v.string(), // "en", "fr", "lingala", "swahili", "hausa", etc.
    sourceLanguage: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ translated: string; detectedLanguage: string }> => {
    const openai = createClient();
    const sourcePart = args.sourceLanguage
      ? `depuis ${args.sourceLanguage}`
      : "(détecte la langue source)";
    const prompt = `Traduis le texte suivant ${sourcePart} vers ${args.targetLanguage}.
Retourne un JSON avec deux champs : "translated" (texte traduit) et "detectedLanguage" (code ISO de la langue source, ex: "fr").
Texte : "${args.text.slice(0, 2000)}"`;

    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let translated = args.text;
    let detectedLanguage = args.sourceLanguage ?? "fr";
    try {
      const parsed = JSON.parse(
        raw.replace(/```json?|```/g, "").trim(),
      ) as Record<string, string>;
      translated = parsed.translated ?? args.text;
      detectedLanguage = parsed.detectedLanguage ?? detectedLanguage;
    } catch {
      translated = raw;
    }

    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await logInteraction(
        ctx,
        identity.tokenIdentifier,
        "translate",
        args.text.slice(0, 200),
        translated.slice(0, 200),
        "openai/gpt-5-mini",
        Date.now() - start,
      );
    }
    return { translated, detectedLanguage };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MODERATE TEXT – check content for policy violations
// ─────────────────────────────────────────────────────────────────────────────

export const moderateText = action({
  args: {
    text: v.string(),
    context: v.optional(v.string()), // "post", "comment", "bio"
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    safe: boolean;
    reason: string;
    severity: "none" | "low" | "medium" | "high";
    categories: string[];
  }> => {
    const openai = createClient();
    const prompt = `Analyse le contenu suivant${args.context ? ` (contexte: ${args.context})` : ""} pour détecter des violations de politique : spam, harcèlement, discours haineux, contenu sexuellement explicite, violence, désinformation.

Retourne un JSON avec :
- "safe": boolean
- "reason": string (description courte en français si violation, sinon "")
- "severity": "none" | "low" | "medium" | "high"  
- "categories": string[] (catégories de violation, ex: ["spam","harcèlement"])

Contenu : "${args.text.slice(0, 1500)}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(raw.replace(/```json?|```/g, "").trim()) as {
        safe?: boolean;
        reason?: string;
        severity?: string;
        categories?: string[];
      };
      return {
        safe: parsed.safe ?? true,
        reason: parsed.reason ?? "",
        severity: ["none", "low", "medium", "high"].includes(
          parsed.severity ?? "",
        )
          ? (parsed.severity as "none" | "low" | "medium" | "high")
          : "none",
        categories: Array.isArray(parsed.categories)
          ? (parsed.categories as string[])
          : [],
      };
    } catch {
      return { safe: true, reason: "", severity: "none", categories: [] };
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PERSONALIZE – generate personalized content recommendations
// ─────────────────────────────────────────────────────────────────────────────

export const aiPersonalize = action({
  args: {
    userInterests: v.array(v.string()),
    userCity: v.optional(v.string()),
    recentActivity: v.array(v.string()), // recent module names/categories visited
    availableModules: v.array(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    recommendedModules: string[];
    recommendedTags: string[];
    welcomeMessage: string;
  }> => {
    const openai = createClient();
    const prompt = `En tant que moteur de recommandation pour une super-app africaine (Débrouille Pro), génère des recommandations personnalisées.

Profil utilisateur :
- Intérêts : ${args.userInterests.join(", ") || "non renseigné"}
- Ville : ${args.userCity ?? "non renseignée"}
- Activité récente : ${args.recentActivity.join(", ") || "aucune"}
- Modules disponibles : ${args.availableModules.join(", ")}

Retourne un JSON avec :
- "recommendedModules": string[] (3-5 noms de modules à recommander)
- "recommendedTags": string[] (5-8 tags/catégories d'intérêt)
- "welcomeMessage": string (message d'accueil personnalisé en français, max 30 mots, chaleureux)`;

    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(raw.replace(/```json?|```/g, "").trim()) as {
        recommendedModules?: string[];
        recommendedTags?: string[];
        welcomeMessage?: string;
      };
      const result = {
        recommendedModules: Array.isArray(parsed.recommendedModules)
          ? (parsed.recommendedModules as string[])
          : [],
        recommendedTags: Array.isArray(parsed.recommendedTags)
          ? (parsed.recommendedTags as string[])
          : [],
        welcomeMessage:
          parsed.welcomeMessage ?? "Bienvenue sur Débrouille Pro !",
      };
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        await logInteraction(
          ctx,
          identity.tokenIdentifier,
          "personalize",
          JSON.stringify({
            interests: args.userInterests,
            city: args.userCity,
          }),
          result.welcomeMessage,
          "openai/gpt-5-mini",
          Date.now() - start,
        );
      }
      return result;
    } catch {
      return {
        recommendedModules: args.availableModules.slice(0, 5),
        recommendedTags: args.userInterests.slice(0, 5),
        welcomeMessage: "Bienvenue sur Débrouille Pro !",
      };
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ANALYZE IMAGE – describe or extract info from an image URL
// ─────────────────────────────────────────────────────────────────────────────

export const analyzeImage = action({
  args: {
    imageUrl: v.string(),
    task: v.union(
      v.literal("describe"), // general description
      v.literal("extract_text"), // OCR
      v.literal("property_info"), // immobilier details
      v.literal("product_info"), // marketplace product
      v.literal("id_verify"), // identity document check (basic)
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ result: string; confidence: "high" | "medium" | "low" }> => {
    const openai = createClient();

    const taskPrompts: Record<string, string> = {
      describe:
        "Décris cette image de manière concise en français (max 100 mots). Contexte africain.",
      extract_text:
        "Extrait tout le texte visible dans cette image. Retourne uniquement le texte brut.",
      property_info:
        "Analyse cette photo de bien immobilier. Identifie : type (maison/appartement/bureau), état estimé (bon/moyen/mauvais), caractéristiques visibles. Réponse en français, max 80 mots.",
      product_info:
        "Identifie ce produit : nom probable, catégorie, état apparent, estimation de valeur en CDF/XAF. Réponse JSON avec champs 'name','category','condition','estimatedValue'.",
      id_verify:
        "Est-ce que cette image ressemble à un document d'identité officiel ? Réponds uniquement par un JSON : {'isIdDocument': boolean, 'documentType': string, 'country': string}",
    };

    const start = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: taskPrompts[args.task] },
            { type: "image_url", image_url: { url: args.imageUrl } },
          ],
        },
      ],
    });

    const result = response.choices[0]?.message?.content ?? "";
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      await logInteraction(
        ctx,
        identity.tokenIdentifier,
        "analyze_image",
        `${args.task}:${args.imageUrl.slice(0, 100)}`,
        result.slice(0, 300),
        "openai/gpt-5-mini",
        Date.now() - start,
      );
    }
    return { result, confidence: "medium" };
  },
});
