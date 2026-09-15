import { View } from "react-native";

// src/features/sante/forms/ClinicForm.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react-native";

// Import du sélecteur d'images réutilisable
import { HealthImageSelector } from "../components/HealthImageSelector";

// ── Schéma Zod ──
export const clinicSchema = z.object({
  name: z.string().min(2, "Nom requis (minimum 2 caractères)"),
  phone: z.string().min(8, "Téléphone requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  country: z.string(),
  open: z.boolean(),
  hours: z.string(),
  specialties: z.string(),
  emergency: z.boolean(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(), // Prise en charge des images dans le schéma [2]
});

export type ClinicFormValues = z.infer<typeof clinicSchema>;

interface ClinicFormProps {
  defaultValues?: Partial<ClinicFormValues>;
  onSubmit: (data: ClinicFormValues) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ClinicForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
}: ClinicFormProps) {
  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      country: "RDC",
      open: true,
      hours: "Lun-Ven 08:00 - 19:00",
      specialties: "",
      emergency: false,
      description: "",
      images: [], // Initialisation du tableau d'images [2]
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <View className="space-y-4 text-left"><FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la clinique *</FormLabel>
              <FormControl>
                <Input placeholder="Clinique du Centre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone *</FormLabel>
              <FormControl>
                <Input placeholder="+243 123 456 789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="contact@clinique.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="address" render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse *</FormLabel>
              <FormControl>
                <Input placeholder="45 Avenue de la Paix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>Ville *</FormLabel>
              <FormControl>
                <Input placeholder="Kinshasa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel>Pays</FormLabel>
              <FormControl>
                <Input placeholder="RDC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="hours" render={({ field }) => (
            <FormItem>
              <FormLabel>Horaires *</FormLabel>
              <FormControl>
                <Input placeholder="Lun-Ven 08:00 - 19:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="specialties" render={({ field }) => (
            <FormItem>
              <FormLabel>Spécialités (séparées par des virgules) *</FormLabel>
              <FormControl>
                <Input placeholder="Médecine Générale, Pédiatrie" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="open" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel>Ouvert</FormLabel>
              </View>
              <FormControl>
                <Switch
                  
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )} /><FormField control={form.control} name="emergency" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel>Urgences acceptées</FormLabel>
              </View>
              <FormControl>
                <Switch
                  
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )} /><FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Présentation..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="images" render={({ field }) => (
            <FormItem>
              <FormControl>
                <HealthImageSelector
                  images={field.value || []}
                  onChange={field.onChange}
                  maxImages={5}
                  label="Photos de la Clinique"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><Button  className="w-full h-11" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? "Enregistrement..." : submitLabel}</Button></View>
    </Form>
  );
}
