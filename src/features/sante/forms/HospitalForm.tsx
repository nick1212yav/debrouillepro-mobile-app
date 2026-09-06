import { View, Text } from "react-native";

// src/features/sante/forms/HospitalForm.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react-native";

// Import du sélecteur d'images réutilisable
import { HealthImageSelector } from "../components/HealthImageSelector";

// ── Schéma Zod ──
export const hospitalSchema = z.object({
  name: z.string().min(2, "Nom requis (minimum 2 caractères)"),
  type: z.enum(["public", "private", "military", "university"] as const),
  phone: z.string().min(8, "Téléphone requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  country: z.string(),
  open: z.boolean(),
  hours: z.string(),
  priceRange: z.string(),
  beds: z.coerce.number().min(0, "Doit être supérieur ou égal à 0"),
  doctors: z.coerce.number().min(0, "Doit être supérieur ou égal à 0"),
  specialties: z.coerce.number().min(0, "Doit être supérieur ou égal à 0"),
  emergency: z.boolean(),
  parking: z.boolean(),
  pharmacy: z.boolean(),
  cafeteria: z.boolean(),
  wifi: z.boolean(),
  description: z.string().optional(),
  services: z.string().optional(),
  website: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).optional(), // Prise en charge des images dans le schéma [2]
});

export type HospitalFormValues = z.infer<typeof hospitalSchema>;

interface HospitalFormProps {
  defaultValues?: Partial<HospitalFormValues>;
  onSubmit: (data: HospitalFormValues) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
}

const HOSPITAL_TYPES: Record<HospitalFormValues["type"], string> = {
  public: "Public",
  private: "Privé",
  military: "Militaire",
  university: "Universitaire",
};

export function HospitalForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
}: HospitalFormProps) {
  const form = useForm<HospitalFormValues>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: {
      name: "",
      type: "public",
      phone: "",
      email: "",
      address: "",
      city: "",
      country: "RDC",
      open: true,
      hours: "24h/24",
      priceRange: "$$",
      beds: 0,
      doctors: 0,
      specialties: 0,
      emergency: true,
      parking: true,
      pharmacy: false,
      cafeteria: false,
      wifi: true,
      description: "",
      services: "",
      website: "",
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
              <FormLabel><Text>Nom de l'hôpital *</Text></FormLabel>
              <FormControl>
                <Input placeholder="Hôpital de Kinshasa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Type d'hôpital *</Text></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(HOSPITAL_TYPES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Input placeholder="contact@hopital.org" {...field} />
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
                <Input placeholder="123 Boulevard Lumumba" {...field} />
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
                <Input placeholder="24h/24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-3">
          <FormField
            control={form.control}
            name="beds"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Lits</Text></FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctors"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Médecins</Text></FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialties"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Spécialités</Text></FormLabel>
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
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Services (séparés par des virgules)</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Pédiatrie, Chirurgie, Maternité"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Site Internet</Text></FormLabel>
              <FormControl>
                <Input placeholder="https://hopital.org" {...field} />
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

        <FormField
          control={form.control}
          name="emergency"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel><Text>Service d'urgence 24h/24</Text></FormLabel>
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
          name="pharmacy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5">
                <FormLabel><Text>Pharmacie intégrée</Text></FormLabel>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Description</Text></FormLabel>
              <FormControl>
                <Textarea placeholder="Présentation..." {...field} />
              </FormControl>
              <FormMessage />
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
                  label="Photos de l'Hôpital"
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
