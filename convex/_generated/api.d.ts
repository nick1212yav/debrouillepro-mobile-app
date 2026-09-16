/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as admin from "../admin.js";
import type * as agri from "../agri.js";
import type * as ai from "../ai.js";
import type * as aiLog from "../aiLog.js";
import type * as aiPreferences from "../aiPreferences.js";
import type * as analytics from "../analytics.js";
import type * as annonceAnalytics from "../annonceAnalytics.js";
import type * as annonceFavorites from "../annonceFavorites.js";
import type * as annonceNotifications from "../annonceNotifications.js";
import type * as annonceOffers from "../annonceOffers.js";
import type * as annonceQuestions from "../annonceQuestions.js";
import type * as annonceReviews from "../annonceReviews.js";
import type * as auth_helpers from "../auth/helpers.js";
import type * as badges from "../badges.js";
import type * as bookmarks from "../bookmarks.js";
import type * as boosts from "../boosts.js";
import type * as challenges from "../challenges.js";
import type * as civic from "../civic.js";
import type * as coCreation from "../coCreation.js";
import type * as comments from "../comments.js";
import type * as commerce from "../commerce.js";
import type * as commerce_escrow from "../commerce/escrow.js";
import type * as commerce_receipt from "../commerce/receipt.js";
import type * as commerce_refund from "../commerce/refund.js";
import type * as community from "../community.js";
import type * as community_index from "../community/index.js";
import type * as contacts from "../contacts.js";
import type * as contentDrafts from "../contentDrafts.js";
import type * as creatorHub from "../creatorHub.js";
import type * as discover from "../discover.js";
import type * as education from "../education.js";
import type * as employment from "../employment.js";
import type * as events from "../events.js";
import type * as explorer from "../explorer.js";
import type * as explorer_ai from "../explorer/ai.js";
import type * as explorer_index from "../explorer/index.js";
import type * as explorer_nearby from "../explorer/nearby.js";
import type * as explorer_opportunities from "../explorer/opportunities.js";
import type * as explorer_ranking from "../explorer/ranking.js";
import type * as explorer_recommendations from "../explorer/recommendations.js";
import type * as explorer_search from "../explorer/search.js";
import type * as explorer_trending from "../explorer/trending.js";
import type * as explorer_universes from "../explorer/universes.js";
import type * as feed from "../feed.js";
import type * as finances from "../finances.js";
import type * as follows from "../follows.js";
import type * as globalContext from "../globalContext.js";
import type * as governance from "../governance.js";
import type * as health from "../health.js";
import type * as hebergement from "../hebergement.js";
import type * as home from "../home.js";
import type * as homeAnalytics from "../homeAnalytics.js";
import type * as homeBuilder from "../homeBuilder.js";
import type * as homeContext from "../homeContext.js";
import type * as homeIntelligence from "../homeIntelligence.js";
import type * as homeRanking from "../homeRanking.js";
import type * as homeRecommendations from "../homeRecommendations.js";
import type * as http from "../http.js";
import type * as index from "../index.js";
import type * as legal from "../legal.js";
import type * as lib_auth from "../lib/auth.js";
import type * as liveStreams from "../liveStreams.js";
import type * as livestream from "../livestream.js";
import type * as localServices from "../localServices.js";
import type * as locations from "../locations.js";
import type * as map from "../map.js";
import type * as media from "../media.js";
import type * as messages from "../messages.js";
import type * as messages_ai from "../messages/ai.js";
import type * as messages_attachments from "../messages/attachments.js";
import type * as messages_calls from "../messages/calls.js";
import type * as messages_conversations from "../messages/conversations.js";
import type * as messages_forwarding from "../messages/forwarding.js";
import type * as messages_index from "../messages/index.js";
import type * as messages_locations from "../messages/locations.js";
import type * as messages_members from "../messages/members.js";
import type * as messages_messages from "../messages/messages.js";
import type * as messages_moderation from "../messages/moderation.js";
import type * as messages_notifications from "../messages/notifications.js";
import type * as messages_pins from "../messages/pins.js";
import type * as messages_polls from "../messages/polls.js";
import type * as messages_presence from "../messages/presence.js";
import type * as messages_reactions from "../messages/reactions.js";
import type * as messages_readReceipts from "../messages/readReceipts.js";
import type * as messages_replies from "../messages/replies.js";
import type * as messages_search from "../messages/search.js";
import type * as messages_typing from "../messages/typing.js";
import type * as messages_voice from "../messages/voice.js";
import type * as migrations from "../migrations.js";
import type * as migrations_addJobIdToPublications from "../migrations/addJobIdToPublications.js";
import type * as migrations_addPropertyIdToImmoPublications from "../migrations/addPropertyIdToImmoPublications.js";
import type * as mobility from "../mobility.js";
import type * as moduleRegistry from "../moduleRegistry.js";
import type * as network from "../network.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as planner from "../planner.js";
import type * as preferences from "../preferences.js";
import type * as privacy from "../privacy.js";
import type * as providers_airtel_money from "../providers/airtel_money.js";
import type * as providers_mpesa from "../providers/mpesa.js";
import type * as providers_mtn_momo from "../providers/mtn_momo.js";
import type * as providers_orange_money from "../providers/orange_money.js";
import type * as providers_payment_provider from "../providers/payment_provider.js";
import type * as publications from "../publications.js";
import type * as pushIdentities from "../pushIdentities.js";
import type * as realestate from "../realestate.js";
import type * as recommendations from "../recommendations.js";
import type * as referrals from "../referrals.js";
import type * as reports from "../reports.js";
import type * as reputation from "../reputation.js";
import type * as reservations from "../reservations.js";
import type * as restauration from "../restauration.js";
import type * as revenues from "../revenues.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as series from "../series.js";
import type * as serviceProviders from "../serviceProviders.js";
import type * as settings from "../settings.js";
import type * as shortVideos from "../shortVideos.js";
import type * as social from "../social.js";
import type * as stories from "../stories.js";
import type * as streaks from "../streaks.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tracking from "../tracking.js";
import type * as transport from "../transport.js";
import type * as travel from "../travel.js";
import type * as urban from "../urban.js";
import type * as users from "../users.js";
import type * as utility from "../utility.js";
import type * as vendor from "../vendor.js";
import type * as voyages from "../voyages.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  admin: typeof admin;
  agri: typeof agri;
  ai: typeof ai;
  aiLog: typeof aiLog;
  aiPreferences: typeof aiPreferences;
  analytics: typeof analytics;
  annonceAnalytics: typeof annonceAnalytics;
  annonceFavorites: typeof annonceFavorites;
  annonceNotifications: typeof annonceNotifications;
  annonceOffers: typeof annonceOffers;
  annonceQuestions: typeof annonceQuestions;
  annonceReviews: typeof annonceReviews;
  "auth/helpers": typeof auth_helpers;
  badges: typeof badges;
  bookmarks: typeof bookmarks;
  boosts: typeof boosts;
  challenges: typeof challenges;
  civic: typeof civic;
  coCreation: typeof coCreation;
  comments: typeof comments;
  commerce: typeof commerce;
  "commerce/escrow": typeof commerce_escrow;
  "commerce/receipt": typeof commerce_receipt;
  "commerce/refund": typeof commerce_refund;
  community: typeof community;
  "community/index": typeof community_index;
  contacts: typeof contacts;
  contentDrafts: typeof contentDrafts;
  creatorHub: typeof creatorHub;
  discover: typeof discover;
  education: typeof education;
  employment: typeof employment;
  events: typeof events;
  explorer: typeof explorer;
  "explorer/ai": typeof explorer_ai;
  "explorer/index": typeof explorer_index;
  "explorer/nearby": typeof explorer_nearby;
  "explorer/opportunities": typeof explorer_opportunities;
  "explorer/ranking": typeof explorer_ranking;
  "explorer/recommendations": typeof explorer_recommendations;
  "explorer/search": typeof explorer_search;
  "explorer/trending": typeof explorer_trending;
  "explorer/universes": typeof explorer_universes;
  feed: typeof feed;
  finances: typeof finances;
  follows: typeof follows;
  globalContext: typeof globalContext;
  governance: typeof governance;
  health: typeof health;
  hebergement: typeof hebergement;
  home: typeof home;
  homeAnalytics: typeof homeAnalytics;
  homeBuilder: typeof homeBuilder;
  homeContext: typeof homeContext;
  homeIntelligence: typeof homeIntelligence;
  homeRanking: typeof homeRanking;
  homeRecommendations: typeof homeRecommendations;
  http: typeof http;
  index: typeof index;
  legal: typeof legal;
  "lib/auth": typeof lib_auth;
  liveStreams: typeof liveStreams;
  livestream: typeof livestream;
  localServices: typeof localServices;
  locations: typeof locations;
  map: typeof map;
  media: typeof media;
  messages: typeof messages;
  "messages/ai": typeof messages_ai;
  "messages/attachments": typeof messages_attachments;
  "messages/calls": typeof messages_calls;
  "messages/conversations": typeof messages_conversations;
  "messages/forwarding": typeof messages_forwarding;
  "messages/index": typeof messages_index;
  "messages/locations": typeof messages_locations;
  "messages/members": typeof messages_members;
  "messages/messages": typeof messages_messages;
  "messages/moderation": typeof messages_moderation;
  "messages/notifications": typeof messages_notifications;
  "messages/pins": typeof messages_pins;
  "messages/polls": typeof messages_polls;
  "messages/presence": typeof messages_presence;
  "messages/reactions": typeof messages_reactions;
  "messages/readReceipts": typeof messages_readReceipts;
  "messages/replies": typeof messages_replies;
  "messages/search": typeof messages_search;
  "messages/typing": typeof messages_typing;
  "messages/voice": typeof messages_voice;
  migrations: typeof migrations;
  "migrations/addJobIdToPublications": typeof migrations_addJobIdToPublications;
  "migrations/addPropertyIdToImmoPublications": typeof migrations_addPropertyIdToImmoPublications;
  mobility: typeof mobility;
  moduleRegistry: typeof moduleRegistry;
  network: typeof network;
  notifications: typeof notifications;
  orders: typeof orders;
  payments: typeof payments;
  planner: typeof planner;
  preferences: typeof preferences;
  privacy: typeof privacy;
  "providers/airtel_money": typeof providers_airtel_money;
  "providers/mpesa": typeof providers_mpesa;
  "providers/mtn_momo": typeof providers_mtn_momo;
  "providers/orange_money": typeof providers_orange_money;
  "providers/payment_provider": typeof providers_payment_provider;
  publications: typeof publications;
  pushIdentities: typeof pushIdentities;
  realestate: typeof realestate;
  recommendations: typeof recommendations;
  referrals: typeof referrals;
  reports: typeof reports;
  reputation: typeof reputation;
  reservations: typeof reservations;
  restauration: typeof restauration;
  revenues: typeof revenues;
  search: typeof search;
  seed: typeof seed;
  series: typeof series;
  serviceProviders: typeof serviceProviders;
  settings: typeof settings;
  shortVideos: typeof shortVideos;
  social: typeof social;
  stories: typeof stories;
  streaks: typeof streaks;
  subscriptions: typeof subscriptions;
  tracking: typeof tracking;
  transport: typeof transport;
  travel: typeof travel;
  urban: typeof urban;
  users: typeof users;
  utility: typeof utility;
  vendor: typeof vendor;
  voyages: typeof voyages;
  wallet: typeof wallet;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
