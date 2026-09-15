import { Pressable, View } from "react-native";

// src/features/sante/forms/MedicalRecordForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

// Import du sélecteur d'images réutilisable
import { HealthImageSelector } from "../components/HealthImageSelector";

export const medicalRecordFormSchema = z.object({
  patientId: z.string().min(1, "Patient requis"),
  doctorId: z.string().optional(),
  type: z.enum([
    "visit",
    "lab",
    "imaging",
    "vaccination",
    "prescription",
    "surgery",
    "hospitalization",
  ]),
  title: z.string().min(1, "Titre requis"),
  date: z.string().min(1, "Date requise"),
  summary: z.string().min(1, "Résumé requis"),
  details: z.string().optional(),
  tags: z.string().optional(),
  attachments: z.array(z.string()).optional(), // Prise en charge des pièces jointes [2]
});

export type MedicalRecordFormValues = z.infer<typeof medicalRecordFormSchema>;

interface MedicalRecordFormProps {
  defaultValues?: Partial<MedicalRecordFormValues>;
  onSubmit: (data: MedicalRecordFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
  patients?: { id: string; name: string }[];
  doctors?: { id: string; name: string }[];
}

export function MedicalRecordForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
  patients = [],
  doctors = [],
}: MedicalRecordFormProps) {
  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordFormSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      type: "visit",
      title: "",
      date: new Date().toISOString().split("T")[0],
      summary: "",
      details: "",
      tags: "",
      attachments: [], // Initialisation du tableau des pièces jointes [2]
      ...defaultValues,
    },
  });

  const typeLabels = {
    visit: "Consultation",
    lab: "Analyse",
    imaging: "Imagerie",
    vaccination: "Vaccination",
    prescription: "Ordonnance",
    surgery: "Chirurgie",
    hospitalization: "Hospitalisation",
  };

  return (
    <Form {...form}>
      <View className="space-y-4 text-left"><View className="gap-4"><FormField control={form.control} name="patientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un patient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="doctorId" render={({ field }) => (
              <FormItem>
                <FormLabel>Médecin (optionnel)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un médecin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} /></View><View className="gap-4"><FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View><FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Consultation cardiologique" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="summary" render={({ field }) => (
            <FormItem>
              <FormLabel>Résumé</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Résumé de la consultation..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="details" render={({ field }) => (
            <FormItem>
              <FormLabel>Détails (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informations détaillées..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="tags" render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (séparés par des virgules)</FormLabel>
              <FormControl>
                <Input
                  placeholder="cardiologie, suivi, hypertension"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="attachments" render={({ field }) => (
            <FormItem>
              <FormControl>
                <HealthImageSelector
                  images={field.value || []}
                  onChange={field.onChange}
                  maxImages={5}
                  label="Pièces Jointes (Analyses, Ordonnances, Clichés)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><Pressable disabled={isLoading} className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 transition-colors disabled:opacity-50 h-11">{isLoading ? "Enregistrement..." : submitLabel}</Pressable></View>
    </Form>
  );
}
