import { View, Text } from "react-native";

// src/features/sante/forms/DoctorForm.tsx
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

// ── Schéma Zod (Sans .default pour compatibilité parfaite avec Shadcn UI) ──
export const doctorSchema = z.object({
  name: z.string().min(2, "Nom requis (minimum 2 caractères)"),
  specialty: z.enum([
    "generaliste",
    "cardiologue",
    "pediatre",
    "gynecologue",
    "dentiste",
    "ophtalmologue",
    "dermatologue",
    "psychiatre",
    "neurologue",
    "chirurgien",
    "orthopediste",
    "orl",
    "urologue",
    "endocrinologue",
    "gastro-enterologue",
    "pneumologue",
    "rhumatologue",
    "allergologue",
    "nutritionniste",
    "psychologue",
  ] as const),
  fees: z.coerce.number().positive("Le tarif doit être positif"),
  currency: z.string(),
  phone: z.string().min(8, "Téléphone requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  country: z.string(),
  bio: z.string().optional(),
  experience: z.coerce.number().min(0, "Doit être un nombre positif"),
  languages: z.string().optional(),
  insurances: z.string().optional(),
  schedule: z.string(),
  online: z.boolean(),
  verified: z.boolean(),
  images: z.array(z.string()).optional(), // Ajout des images au schéma de validation [2]
});

export type DoctorFormValues = z.infer<typeof doctorSchema>;

// ── Props ──
interface DoctorFormProps {
  defaultValues?: Partial<DoctorFormValues>;
  onSubmit: (data: DoctorFormValues) => Promise<void> | void;
  isLoading?: boolean;
  submitLabel?: string;
}

// Étiquettes des spécialités
const SPECIALTY_LABELS: Record<DoctorFormValues["specialty"], string> = {
  generaliste: "Généraliste",
  cardiologue: "Cardiologue",
  pediatre: "Pédiatre",
  gynecologue: "Gynécologue",
  dentiste: "Dentiste",
  ophtalmologue: "Ophtalmologue",
  dermatologue: "Dermatologue",
  psychiatre: "Psychiatre",
  neurologue: "Neurologue",
  chirurgien: "Chirurgien",
  orthopediste: "Orthopédiste",
  orl: "ORL",
  urologue: "Urologue",
  endocrinologue: "Endocrinologue",
  "gastro-enterologue": "Gastro-entérologue",
  pneumologue: "Pneumologue",
  rhumatologue: "Rhumatologue",
  allergologue: "Allergologue",
  nutritionniste: "Nutritionniste",
  psychologue: "Psychologue",
};

export function DoctorForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
}: DoctorFormProps) {
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      specialty: "generaliste",
      fees: 0,
      currency: "FCFA",
      phone: "",
      email: "",
      address: "",
      city: "",
      country: "RDC",
      bio: "",
      experience: 0,
      languages: "",
      insurances: "",
      schedule: "Lun-Ven 09:00 - 18:00",
      online: false,
      verified: false,
      images: [], // Initialisation du tableau d'images [2]
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <View className="space-y-4 text-left">{}<FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet *</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Jean Dupont" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="specialty" render={({ field }) => (
            <FormItem>
              <FormLabel>Spécialité *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une spécialité" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(SPECIALTY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone *</FormLabel>
              <FormControl>
                <Input placeholder="+243 123 456 789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="dr.dupont@exemple.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="address" render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse *</FormLabel>
              <FormControl>
                <Input placeholder="12 Avenue Lumumba" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>Ville *</FormLabel>
              <FormControl>
                <Input placeholder="Kinshasa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel>Pays</FormLabel>
              <FormControl>
                <Input placeholder="RDC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="fees" render={({ field }) => (
            <FormItem>
              <FormLabel>Tarif de consultation</FormLabel>
              <FormControl>
                <Input type="number" placeholder="25000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel>Devise</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Devise" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FCFA">FCFA</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="experience" render={({ field }) => (
            <FormItem>
              <FormLabel>Expérience (années)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="languages" render={({ field }) => (
            <FormItem>
              <FormLabel>Langues parlées</FormLabel>
              <FormControl>
                <Input placeholder="Français, Anglais, Lingala" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="insurances" render={({ field }) => (
            <FormItem>
              <FormLabel>Assurances acceptées</FormLabel>
              <FormControl>
                <Input placeholder="Mutuelle, RAM, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="schedule" render={({ field }) => (
            <FormItem>
              <FormLabel>Horaires</FormLabel>
              <FormControl>
                <Input placeholder="Lun-Ven 09:00 - 18:00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="bio" render={({ field }) => (
            <FormItem>
              <FormLabel>Biographie</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Présentation du médecin, diplômes, etc."
                  className=""
                  rows={4}
                  {...field}
                />
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
                  label="Photos du Profil & Cabinet Médical"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="online" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5"><FormLabel>Consultation en ligne</FormLabel><View className="text-sm text-muted-foreground"><Text>Le médecin propose des consultations à distance</Text></View></View>
              <FormControl>
                <Switch
                  
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )} />{}<FormField control={form.control} name="verified" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <View className="space-y-0.5"><FormLabel>Compte vérifié</FormLabel><View className="text-sm text-muted-foreground"><Text>Le profil a été validé par l'administration</Text></View></View>
              <FormControl>
                <Switch
                  
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )} />{}<Button  className="w-full h-11" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? "Enregistrement..." : submitLabel}</Button></View>
    </Form>
  );
}
