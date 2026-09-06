import { View, Text } from "react-native";

// src/features/sante/forms/PharmacyForm.tsx
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
export const pharmacySchema = z.object({
  name: z.string().min(2, "Nom requis (minimum 2 caractères)"),
  phone: z.string().min(8, "Téléphone requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  country: z.string(),
  open: z.boolean(),
  hours: z.string(),
  services: z.string(),
  delivery: z.boolean(),
  deliveryRadius: z.coerce.number().min(0),
  deliveryFee: z.coerce.number().min(0),
  onlineOrders: z.boolean(),
  acceptsInsurance: z.boolean(),
  images: z.array(z.string()).optional(), // Prise en charge des images dans le schéma [2]
});

export type PharmacyFormValues = z.infer<typeof pharmacySchema>;

interface PharmacyFormProps {
  defaultValues?: Partial<PharmacyFormValues>;
  onSubmit: (data: PharmacyFormValues) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function PharmacyForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
}: PharmacyFormProps) {
  const form = useForm<PharmacyFormValues>({
    resolver: zodResolver(pharmacySchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      country: "RDC",
      open: true,
      hours: "Lun-Ven 08:00 - 20:00",
      services: "",
      delivery: false,
      deliveryRadius: 5,
      deliveryFee: 0,
      onlineOrders: true,
      acceptsInsurance: false,
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
              <FormLabel><Text>Nom de la pharmacie *</Text></FormLabel>
              <FormControl>
                <Input placeholder="Pharmacie du Centre" {...field} />
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
              <FormLabel><Text>Téléphone *</Text></FormLabel>
              <FormControl>
                <Input placeholder="+243 123 456 789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Email</Text></FormLabel>
              <FormControl>
                <Input placeholder="contact@pharmacie.com" {...field} />
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
                <Input placeholder="78 Rue de la République" {...field} />
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
              <FormLabel><Text>Horaires d'ouverture *</Text></FormLabel>
              <FormControl>
                <Input placeholder="Lun-Ven 08:00 - 20:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Services (séparés par des virgules)</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Vente en ligne, Conseils, Test rapide"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-3">
          <FormField
            control={form.control}
            name="deliveryRadius"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Rayon de livraison (km)</Text></FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Frais de livraison (FCFA)</Text></FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <FormField
          control={form.control}
          name="open"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel><Text>Ouverte</Text></FormLabel>
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

        <FormField
          control={form.control}
          name="delivery"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel><Text>Livraison disponible</Text></FormLabel>
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

        <FormField
          control={form.control}
          name="onlineOrders"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel><Text>Commandes en ligne acceptées</Text></FormLabel>
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

        <FormField
          control={form.control}
          name="acceptsInsurance"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel><Text>Tiers payant / Assurances acceptés</Text></FormLabel>
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

        {/* Intégration du sélecteur d'images réutilisable [2] */}
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
                  label="Photos de la Pharmacie"
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
