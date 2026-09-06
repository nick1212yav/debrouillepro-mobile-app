// src/features/transport/fields.ts
import type { FieldPath } from "react-hook-form";
import type { TransportRouteFormValues } from "./validators/transport.validator";

export interface FormFieldMeta {
  name: FieldPath<TransportRouteFormValues>;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "switch";
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

export const transportFields: FormFieldMeta[] = [
  {
    name: "origin",
    label: "Lieu de départ",
    type: "text",
    placeholder: "Gare Centrale, Kinshasa",
    required: true,
  },
  {
    name: "destination",
    label: "Destination",
    type: "text",
    placeholder: "Aéroport de N'djili",
    required: true,
  },
  {
    name: "departureTime",
    label: "Heure de départ",
    type: "text",
    placeholder: "Ex: 14:30",
    required: true,
  },
  {
    name: "vehicleType",
    label: "Moyen de transport",
    type: "select",
    required: true,
    options: [
      { value: "voiture", label: "Covoiturage" },
      { value: "taxi", label: "Taxi" },
      { value: "moto", label: "Moto-Taxi" },
      { value: "minibus", label: "Minibus" },
      { value: "bus", label: "Bus" },
      { value: "camion", label: "Camion" },
    ],
  },
  {
    name: "seats",
    label: "Nombre de places",
    type: "number",
    required: true,
  },
  {
    name: "pricePerSeat",
    label: "Prix de la course",
    type: "number",
    required: true,
  },
  {
    name: "vehicleModel",
    label: "Marque et modèle",
    type: "text",
    placeholder: "Toyota IST",
    required: false,
  },
  {
    name: "vehiclePlate",
    label: "Immatriculation",
    type: "text",
    placeholder: "1234AB01",
    required: false,
  },
  {
    name: "description",
    label: "Consignes de voyage",
    type: "textarea",
    placeholder: "Bagages volumineux acceptés...",
    required: false,
  },
];
