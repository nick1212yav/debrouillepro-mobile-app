import type { ModuleManifest } from "../../core/sdk/types";
import { subtypes } from "./subtypes";
import { fields } from "./fields";
import { actions } from "./actions";
import { metrics } from "./metrics";
import { lifecycle } from "./lifecycle";
import { adapter } from "./adapter";
import { searchConfig } from "./search";
import { permissions } from "./permissions";

export const jobManifest: ModuleManifest = {
  info: {
    id: "job",
    label: "Emploi",
    icon: "💼",
    color: "#1DB981",
    gradient: "from-emerald-500 to-green-600",
    badge: "Emploi",
    description: "Offres d'emploi, stages, missions et recrutement",
    version: "1.0.0",
  },
  subtypes,
  fields,
  actions, // pure description
  metrics,
  queries: {
    list: "employment.listJobs",
    search: "employment.searchJobs",
    getById: "employment.getJob",
  },
  mutations: {
    create: "employment.createJob",
    apply: "employment.applyToJob",
  },
  capabilities: ({ publication, user }) => ({
    call: true,
    chat: true,
    share: true,
    save: true,
    whatsapp: true,
    email: true,
    payment: publication?.isPaid || user?.premium || false,
    booking: false,
  }),
  card: {
    hero: "title",
    sections: ["company", "city"],
    metrics: ["salary", "contract"],
  },
  permissions,
  ai: {
    category: "job",
    matchingFields: ["skills", "title", "description"],
    embeddingFields: ["title", "description", "skills"],
    promptTemplate: "Offre d'emploi : {title} chez {company}",
  },
  search: searchConfig,
  dependencies: { required: ["auth"] },
  compatibility: { sdk: "1.0.0" },
  defaults: ({ country = "Congo", currency = "USD" }) => ({
    country,
    currency,
    remote: false,
  }),
  featureFlags: { premium: false },
  lifecycle,
  adapter,
  plugins: ["analytics", "ai"],
};
