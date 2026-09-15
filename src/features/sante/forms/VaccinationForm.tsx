import { View } from "react-native";

// src/features/sante/forms/VaccinationForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react-native";

// ── Schéma Zod (Dossier médical d'une vaccination) ──
export const vaccinationSchema = z.object({
  patientId: z.string().min(1, "Patient requis"),
  name: z.string().min(2, "Nom du vaccin requis (minimum 2 caractères)"),
  date: z.string().min(1, "Date requise"),
  nextDose: z.string().optional().or(z.literal("")),
  status: z.enum(["completed", "pending", "overdue"] as const),
  administeredBy: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  batchNumber: z.string().optional().or(z.literal("")),
  sideEffects: z.string().optional().or(z.literal("")),
});

export type VaccinationFormValues = z.infer<typeof vaccinationSchema>;

interface VaccinationFormProps {
  defaultValues?: Partial<VaccinationFormValues>;
  onSubmit: (data: VaccinationFormValues) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
  patients?: { id: string; name: string }[];
}

export function VaccinationForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
  patients = [],
}: VaccinationFormProps) {
  const form = useForm<VaccinationFormValues>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      patientId: "",
      name: "",
      date: new Date().toISOString().split("T")[0],
      nextDose: "",
      status: "completed",
      administeredBy: "",
      location: "",
      batchNumber: "",
      sideEffects: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <View className="space-y-4 text-left">{}<FormField control={form.control} name="patientId" render={({ field }) => (
            <FormItem>
              <FormLabel>Patient *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un patient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du vaccin *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: BCG, Fièvre jaune, COVID-19"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date d'administration *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="nextDose" render={({ field }) => (
            <FormItem>
              <FormLabel>Date de rappel conseillée</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Statut *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="administeredBy" render={({ field }) => (
            <FormItem>
              <FormLabel>Administré par</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Dr. Kabange" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Lieu de vaccination</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Clinique Ngaliema" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="batchNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de lot</FormLabel>
              <FormControl>
                <Input placeholder="Ex: B4902-X" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="sideEffects" render={({ field }) => (
            <FormItem>
              <FormLabel>Effets secondaires signalés</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Légère fièvre, courbatures"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><Button  className="w-full h-11" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? "Enregistrement..." : submitLabel}</Button></View>
    </Form>
  );
}
