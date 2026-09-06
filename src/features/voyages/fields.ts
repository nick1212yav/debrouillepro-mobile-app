// src/features/voyages/fields.ts
import type { FieldConfig } from "@/core/sdk/types/field.types";
export const voyageFields: Record<string, any> = {
  // ✅ Typé en any pour la flexibilité du SDK
  // Champs de recherche
  searchFrom: {
    name: "from", // ✅ Correction : id -> name pour satisfaire FieldConfig [1]
    label: "Départ",
    type: "text",
    required: false,
    placeholder: "Ville de départ",
  },
  searchTo: {
    name: "to",
    label: "Destination",
    type: "text",
    required: false,
    placeholder: "Ville d'arrivée",
  },
  searchDate: {
    name: "date",
    label: "Date",
    type: "date",
    required: false,
  },
  searchType: {
    name: "type",
    label: "Type de transport",
    type: "select",
    required: false,
    options: [
      { value: "Bus", label: "Bus" },
      { value: "Minibus", label: "Minibus" },
      { value: "Avion", label: "Avion" },
      { value: "Train", label: "Train" },
      { value: "Bateau", label: "Bateau" },
    ],
  },
  // Champs de réservation
  bookingSeats: {
    name: "seats",
    label: "Nombre de places",
    type: "number",
    required: true,
    min: 1,
    max: 10,
  },
  bookingPassengerName: {
    name: "passengerName",
    label: "Nom du passager",
    type: "text",
    required: true,
    placeholder: "Nom complet",
  },
  bookingPassengerPhone: {
    name: "passengerPhone",
    label: "Téléphone",
    type: "text",
    required: false,
    placeholder: "+243 999 999 999",
  },
  bookingPassengerEmail: {
    name: "passengerEmail",
    label: "Email",
    type: "email",
    required: false,
    placeholder: "email@exemple.com",
  },
  // Champs de paiement
  paymentMethod: {
    name: "method",
    label: "Moyen de paiement",
    type: "select",
    required: true,
    options: [
      { value: "mobile_money", label: "Mobile Money" },
      { value: "card", label: "Carte bancaire" },
      { value: "wallet", label: "Portefeuille DébrouillePro" },
    ],
  },
  paymentPhone: {
    name: "phone",
    label: "Numéro Mobile Money",
    type: "text",
    required: false,
    placeholder: "Numéro de téléphone",
  },
};
export const voyageSearchFields: FieldConfig[] = [
  voyageFields.searchFrom,
  voyageFields.searchTo,
  voyageFields.searchDate,
  voyageFields.searchType,
];
export const voyageBookingFields: FieldConfig[] = [
  voyageFields.bookingSeats,
  voyageFields.bookingPassengerName,
  voyageFields.bookingPassengerPhone,
  voyageFields.bookingPassengerEmail,
];
export const voyagePaymentFields: FieldConfig[] = [
  voyageFields.paymentMethod,
  voyageFields.paymentPhone,
];
// ✅ Ajouté pour l'enregistrement du registre manifest du SDK (attendant un tableau plat) [1]
export const voyageFieldsList: FieldConfig[] = [
  ...voyageSearchFields,
  ...voyageBookingFields,
  ...voyagePaymentFields,
];
