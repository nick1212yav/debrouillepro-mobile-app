export const metrics = [
  {
    key: "rating",
    label: "Note moyenne",
    icon: "Star",
    format: (value: number) => value.toFixed(1),
  },
  {
    key: "reviewCount",
    label: "Avis",
    icon: "MessageCircle",
    format: (value: number) => `${value} avis`,
  },
  {
    key: "responseTime",
    label: "Temps de réponse",
    icon: "Clock",
  },
  {
    key: "price",
    label: "Tarif",
    icon: "DollarSign",
  },
];
