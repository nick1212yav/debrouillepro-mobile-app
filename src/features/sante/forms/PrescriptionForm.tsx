import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
// src/features/sante/forms/PrescriptionForm.tsx
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  Calendar,
  Clipboard,
  User,
  Heart,
  Settings,
  Loader2,
} from "lucide-react-native";

const medicationSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  dosage: z.string().min(1, "Dosage requis"),
  frequency: z.string().min(1, "Fréquence requise"),
  duration: z.string().min(1, "Durée requise"),
});

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient requis"),
  doctorId: z.string().min(1, "Médecin requis"),
  date: z.string().min(1, "Date requise"),
  validUntil: z.string().min(1, "Date de validité requise"),
  medications: z
    .array(medicationSchema)
    .min(1, "Au moins un médicament requis"),
  notes: z.string(),
  status: z.enum(["active", "cancelled", "expired", "dispensed"]),
  refills: z.number(),
});

export type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;

interface PrescriptionFormProps {
  defaultValues?: Partial<PrescriptionFormValues>;
  onSubmit: (data: PrescriptionFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
  patients?: { id: string; name: string }[];
  doctors?: { id: string; name: string }[];
}

export function PrescriptionForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Enregistrer",
  patients = [],
  doctors = [],
}: PrescriptionFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      date: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
      notes: "",
      status: "active",
      refills: 0,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications",
  });

  return (
    <View
     
      className="space-y-4 text-left text-white text-xs"
    >
      {/* Patient & Médecin */}
      <View className="gap-3">
        <View className="flex flex-col gap-1.5">
          <Text className="text-white/60 font-medium flex items-center gap-1">
            <User size={12} className="text-indigo-400" />
            <Text>Patient *</Text>
          </Text>
          <Picker
            {...register("patientId")}
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <Picker.Item label="Choisir un patient" value="" />
            {patients.map((p) => (
              <Picker.Item label={`${p.name}`} value={p.id} />
            ))}
          </Picker>
          {errors.patientId && (
            <Text className="text-red-400 text-[10px]">
              {errors.patientId.message}
            </Text>
          )}
        </View>

        <View className="flex flex-col gap-1.5">
          <Text className="text-white/60 font-medium flex items-center gap-1">
            <Heart size={12} className="text-indigo-400" />
            <Text>Médecin prescripteur *</Text>
          </Text>
          <Picker
            {...register("doctorId")}
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <Picker.Item label="Choisir un médecin" value="" />
            {doctors.map((d) => (
              <Picker.Item label={`${d.name}`} value={d.id} />
            ))}
          </Picker>
          {errors.doctorId && (
            <Text className="text-red-400 text-[10px]">
              {errors.doctorId.message}
            </Text>
          )}
        </View>
      </View>

      {/* Dates de prescription et validité */}
      <View className="gap-3">
        <View className="flex flex-col gap-1.5">
          <Text className="text-white/60 font-medium flex items-center gap-1">
            <Calendar size={12} className="text-indigo-400" />
            <Text>Date de prescription *</Text>
          </Text>
          <TextInput
           
            {...register("date")}
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          {errors.date && (
            <Text className="text-red-400 text-[10px]">{errors.date.message}</Text>
          )}
        </View>

        <View className="flex flex-col gap-1.5">
          <Text className="text-white/60 font-medium flex items-center gap-1">
            <Calendar size={12} className="text-indigo-400" />
            <Text>Valide jusqu'au *</Text>
          </Text>
          <TextInput
           
            {...register("validUntil")}
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          {errors.validUntil && (
            <Text className="text-red-400 text-[10px]">
              {errors.validUntil.message}
            </Text>
          )}
        </View>
      </View>

      {/* Section des médicaments dynamiques */}
      <View className="space-y-3.5 pt-2">
        <View className="flex justify-between items-baseline border-b border-white/5 pb-2">
          <Text className="text-white font-bold text-sm">
            Médicaments prescrits
          </Text>
          <Pressable
           
            onPress={() =>
              append({ name: "", dosage: "", frequency: "", duration: "" })
            }
            className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center gap-1 text-[10px] font-bold uppercase"
          >
            <Plus size={10} />
            <Text>Ajouter</Text>
          </Pressable>
        </View>

        {fields.map((field, index) => (
          <View
            key={field.id}
            className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3 relative"
          >
            <View className="flex justify-between items-center">
              <Text className="text-white/40 uppercase font-black text-[9px]">
                Médicament #{index + 1}
              </Text>
              {fields.length > 1 && (
                <Pressable
                 
                  onPress={() => remove(index)}
                  className="p-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400"
                >
                  <Trash2 size={12} />
                </Pressable>
              )}
            </View>

            <View className="gap-3">
              <View className="flex flex-col gap-1">
                <TextInput
                 
                  placeholder="Dénomination du produit"
                  {...register(`medications.${index}.name` as const)}
                  className="w-full h-9 px-2.5 rounded-lg bg-black/40 border border-white/5 text-white"
                />
              </View>

              <View className="flex flex-col gap-1">
                <TextInput
                 
                  placeholder="Dosage (ex: 500mg)"
                  {...register(`medications.${index}.dosage` as const)}
                  className="w-full h-9 px-2.5 rounded-lg bg-black/40 border border-white/5 text-white"
                />
              </View>

              <View className="flex flex-col gap-1">
                <TextInput
                 
                  placeholder="Posologie (ex: 1 comp matin et soir)"
                  {...register(`medications.${index}.frequency` as const)}
                  className="w-full h-9 px-2.5 rounded-lg bg-black/40 border border-white/5 text-white"
                />
              </View>

              <View className="flex flex-col gap-1">
                <TextInput
                 
                  placeholder="Durée du traitement (ex: 7 jours)"
                  {...register(`medications.${index}.duration` as const)}
                  className="w-full h-9 px-2.5 rounded-lg bg-black/40 border border-white/5 text-white"
                />
              </View>
            </View>
          </View>
        ))}
        {errors.medications && (
          <Text className="text-red-400 text-[10px]">
            {errors.medications.message}
          </Text>
        )}
      </View>

      {/* Paramètres additionnels */}
      <View className="gap-3 pt-2">
        <View className="flex flex-col gap-1.5">
          <Text className="text-white/60 font-medium flex items-center gap-1">
            <Settings size={12} className="text-indigo-400" />
            <Text>Nombre de renouvellements</Text>
          </Text>
          <TextInput
           
            {...register("refills")}
            placeholder="0"
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
           keyboardType="numeric"/>
        </View>

        <View className="flex flex-col gap-1.5">
          <Text className="text-white/60 font-medium flex items-center gap-1">
            <Clipboard size={12} className="text-indigo-400" />
            <Text>Statut de validité</Text>
          </Text>
          <Picker
            {...register("status")}
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <Picker.Item label="Actif / Valide" value="active" />
            <Picker.Item label="Délivré / Dispensé" value="dispensed" />
            <Picker.Item label="Annulé / Suspendu" value="cancelled" />
            <Picker.Item label="Expiré" value="expired" />
          </Picker>
        </View>
      </View>

      {/* Remarques posologiques */}
      <View className="flex flex-col gap-1.5 pt-2">
        <Text className="text-white/60 font-medium">
          Recommandations & Remarques posologiques
        </Text>
        <TextInput
         
          {...register("notes")}
          placeholder="Prendre avec un grand verre d'eau, éviter l'alcool..."
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white"
         multiline textAlignVertical="top"/>
      </View>

      <Pressable
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-orange-700 disabled:opacity-50 h-11 flex items-center justify-center"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Enregistrement..." : submitLabel}
      </Pressable>
    </View>
  );
}
