export interface FieldDefinition {
  name: string;
  type:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "time"
    | "date";
  label: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
}

export const restaurantCreationFields: FieldDefinition[] = [
  {
    name: "name",
    type: "text",
    label: "Nom de l'établissement",
    placeholder: "Ex: Maquis de la Paix",
    required: true,
  },
  {
    name: "cuisine",
    type: "select",
    label: "Type de cuisine",
    required: true,
    options: [
      "Africaine",
      "Fusion",
      "Pizza",
      "Café & Snack",
      "Grillades",
      "Européenne",
    ],
  },
  {
    name: "location",
    type: "text",
    label: "Adresse physique",
    placeholder: "Ex: Rue des Jardins, Abidjan, Côte d'Ivoire",
    required: true,
  },
  {
    name: "minOrder",
    type: "number",
    label: "Minimum de commande (FCFA)",
    required: true,
    defaultValue: 2000,
    validation: { min: 0 },
  },
  {
    name: "description",
    type: "textarea",
    label: "Description de l'établissement",
    placeholder: "Décrivez l'histoire de votre cuisine et vos plats phares...",
    required: false,
  },
];

export const bookingFormFields: FieldDefinition[] = [
  {
    name: "date",
    type: "date",
    label: "Date de réservation",
    required: true,
  },
  {
    name: "time",
    type: "time",
    label: "Heure d'arrivée",
    required: true,
  },
  {
    name: "guests",
    type: "number",
    label: "Nombre de couverts",
    required: true,
    defaultValue: 2,
    validation: { min: 1, max: 20 },
  },
  {
    name: "section",
    type: "select",
    label: "Zone préférée",
    required: true,
    options: ["standard", "terrace", "vip", "private_room"],
  },
];
