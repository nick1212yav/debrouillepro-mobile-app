import { View, Text } from "react-native";

// src/features/sante/forms/AmbulanceForm.tsx
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react-native";

// Import du sélecteur d'images réutilisable
import { HealthImageSelector } from "../components/HealthImageSelector";

// ── Schéma Zod ──
export const ambulanceSchema = z.object({
  name: z.string().min(2, "Nom requis (minimum 2 caractères)"),
  phone: z.string().min(8, "Téléphone requis"),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  country: z.string(),
  hours: z.string(),
  emergencyPhone: z.string(),
  available: z.boolean(), // typé selon switch [2]
  vehicles: z.coerce.number().min(0, "Nombre de véhicules invalide"),
  paramedics: z.coerce.number().min(0, "Nombre d'ambulanciers invalide"),
  images: z.array(z.string()).optional(), // Ajout du type images au schéma [2]
});

export type AmbulanceFormValues = z.infer<typeof ambulanceSchema>;

interface AmbulanceFormProps {
  defaultValues?: Partial<AmbulanceFormValues>;
  onSubmit: (data: AmbulanceFormValues) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function AmbulanceForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
}: AmbulanceFormProps) {
  const form = useForm<AmbulanceFormValues>({
    resolver: zodResolver(ambulanceSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      country: "RDC",
      hours: "24h/24",
      emergencyPhone: "15",
      available: true,
      vehicles: 1,
      paramedics: 1,
      images: [], // Initialisation du tableau d'images [2]
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <View
       
        className="space-y-4 text-left"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nom du service d'ambulance *</Text></FormLabel>
              <FormControl>
                <Input placeholder="Ambulance Rapide" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Téléphone standard *</Text></FormLabel>
              <FormControl>
                <Input placeholder="+243 123 456 789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergencyPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Numéro d'urgence direct *</Text></FormLabel>
              <FormControl>
                <Input placeholder="112" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Adresse *</Text></FormLabel>
              <FormControl>
                <Input placeholder="15 Avenue de l'Hôpital" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Ville *</Text></FormLabel>
              <FormControl>
                <Input placeholder="Kinshasa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Pays</Text></FormLabel>
              <FormControl>
                <Input placeholder="RDC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Heures de service *</Text></FormLabel>
              <FormControl>
                <Input placeholder="24h/24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicles"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nombre de véhicules opérationnels *</Text></FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paramedics"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nombre de secouristes / ambulanciers *</Text></FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="available"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel><Text>Disponible actuellement</Text></FormLabel>
              </View>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Intégration harmonieuse du sélecteur d'images [2] */}
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <HealthImageSelector
                  images={field.value || []}
                  onChange={field.onChange}
                  maxImages={5}
                  label="Photos des Véhicules d'Ambulance"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Enregistrement..." : submitLabel}
        </Button>
      </View>
    </Form>
  );
}
