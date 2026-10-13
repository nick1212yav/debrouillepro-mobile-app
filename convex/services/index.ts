// convex/services/index.ts
//
// Backend Services V1 — point d'entrée documentation.
//
// Ce fichier ne contient AUCUNE fonction Convex exposée.
// Il documente l'organisation du module Services.
//
// ─── Architecture ───────────────────────────────────────────────
//
//   services/
//   ├── categories.ts        référentiel catégories/sous-catégories
//   ├── migrations.ts        migration providers legacy → V1
//   ├── search.ts            adapter Search V2
//   ├── providers.ts         CRUD owner + lifecycle
//   ├── bookings.ts          réservations, transitions
//   ├── quotes.ts            devis
//   ├── reviews.ts           avis + réponse + signalement
//   ├── availability.ts      créneaux + exceptions
//   ├── questions.ts         Q&R prestataire
//   ├── favorites.ts         favoris client
//   ├── disputes.ts          litiges + résolution admin
//   ├── reports.ts           signalements + modération
//   ├── packages.ts          offres packagées
//   ├── verification.ts      KYC + documents
//   ├── promotions.ts        mise en avant
//   ├── stats.ts             métriques + snapshots
//   ├── recurring.ts         réservations récurrentes
//   ├── contracts.ts         contrats + signature
//   ├── invoices.ts          factures + paiements
//   └── payments.ts          pont Payment Core
//
// ─── Compatibilité ──────────────────────────────────────────────
//
// api.serviceProviders.* reste ACTIF — le frontend n'a pas été migré.
// Aucun fichier services/* ne remplace ce point d'entrée.
//
// ─── Base de données ────────────────────────────────────────────
//
// 21 tables :
//   serviceProviders, serviceReviews, serviceQuestions,
//   serviceQuotes, serviceFavorites, serviceAvailability,
//   serviceHistory, serviceBookings,
//   serviceCategories, serviceSubcategories, servicePackages,
//   serviceVerificationDocuments, serviceDisputes, serviceReports,
//   serviceProviderStats, servicePromotions,
//   serviceAvailabilityExceptions, serviceInvoices,
//   serviceInvoiceCounters, serviceContracts,
//   serviceRecurringBookings

export const SERVICES_V1_VERSION = "1.0.0";
