import { View, Text } from "react-native";

// src/features/sante/forms/LaboratoryForm.tsx
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
export const laboratorySchema = z.object({
  name: z.string().min(2, "Nom requis (minimum 2 caractères)"),
  phone: z.string().min(8, "Téléphone requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  country: z.string(),
  open: z.boolean(),
  hours: z.string(),
  tests: z.coerce
    .number()
    .min(0, "Le nombre de tests doit être supérieur ou égal à 0"),
  equipment: z.coerce
    .number()
    .min(0, "Le nombre d'équipements doit être supérieur ou égal à 0"),
  testsList: z.string(),
  images: z.array(z.string()).optional(), // Prise en charge des images dans le schéma [2]
});

export type LaboratoryFormValues = z.infer<typeof laboratorySchema>;

interface LaboratoryFormProps {
  defaultValues?: Partial<LaboratoryFormValues>;
  onSubmit: (data: LaboratoryFormValues) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function LaboratoryForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
}: LaboratoryFormProps) {
  const form = useForm<LaboratoryFormValues>({
    resolver: zodResolver(laboratorySchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      country: "RDC",
      open: true,
      hours: "Lun-Ven 07:00 - 18:00",
      tests: 0,
      equipment: 0,
      testsList: "",
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
              <FormLabel><Text>Nom du laboratoire *</Text></FormLabel>
              <FormControl>
                <Input placeholder="Laboratoire Central" {...field} />
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
                <Input placeholder="contact@labo.com" {...field} />
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
                <Input placeholder="34 Avenue de la Science" {...field} />
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
                <Input placeholder="Lun-Ven 07:00 - 18:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-3">
          <FormField
            control={form.control}
            name="tests"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Capacité de tests quotidiens *</Text></FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="equipment"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Équipements majeurs *</Text></FormLabel>
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
          name="testsList"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Liste des tests disponibles (séparés par des virgules) *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Hémogramme, Glycémie, PCR Covid"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="open"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel><Text>Ouvert</Text></FormLabel>
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
                  label="Photos des Équipements & Laboratoire"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Enregistrement..." : submitLabel}
        </Button>
      </View>
    </Form>
  );
}
