import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
// src/features/sante/forms/AppointmentForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const appointmentSchema = z.object({
  doctorId: z.string().min(1, "Médecin requis"),
  patientId: z.string().min(1, "Patient requis"),
  date: z.string().min(1, "Date requise"),
  slot: z.string().min(1, "Créneau requis"),
  type: z.enum([
    "consultation",
    "teleconsultation",
    "emergency",
    "follow-up",
  ] as const),
  durationMinutes: z.number().positive(),
  notes: z.string(),
  reminder: z.boolean(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  defaultValues?: Partial<AppointmentFormValues>;
  onSubmit: (data: AppointmentFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
  doctors?: { id: string; name: string }[];
  patients?: { id: string; name: string }[];
}

const DEFAULT_SLOTS = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];

export function AppointmentForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "Réserver",
  doctors = [],
  patients = [],
}: AppointmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorId: "",
      patientId: "",
      date: new Date().toISOString().split("T")[0],
      slot: "",
      type: "consultation",
      durationMinutes: 30,
      notes: "",
      reminder: true,
      ...defaultValues,
    },
  });

  return (
    <View
     
      className="space-y-4 text-left text-white text-xs"
    >
      {/* Sélecteur de médecin */}
      <View className="flex flex-col gap-1.5">
        <Text className="text-white/60 font-medium">Médecin *</Text>
        <Picker
          {...register("doctorId")}
          className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          <Picker.Item label="Sélectionner un médecin" value="" />
          {doctors.map((d) => (
            <Picker.Item label={`${d.name}`} value={d.id} />
          ))}
        </Picker>
        {errors.doctorId && (
          <Text className="text-red-400 text-[10px]">{errors.doctorId.message}</Text>
        )}
      </View>

      {/* Sélecteur de patient */}
      <View className="flex flex-col gap-1.5">
        <Text className="text-white/60 font-medium">Patient *</Text>
        <Picker
          {...register("patientId")}
          className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          <Picker.Item label="Sélectionner un patient" value="" />
          {patients.map((p) => (
            <Picker.Item label={`${p.name}`} value={p.id} />
          ))}
        </Picker>
        {errors.patientId && (
          <Text className="text-red-400 text-[10px]">{errors.patientId.message}</Text>
        )}
      </View>

      {/* Date et Créneau */}
      <View className="gap-3">
        <View className="flex flex-col gap-1.5">
          <Text className="text-white/60 font-medium">Date *</Text>
          <TextInput
           
            {...register("date")}
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
          />
          {errors.date && (
            <Text className="text-red-400 text-[10px]">{errors.date.message}</Text>
          )}
        </View>

        <View className="flex flex-col gap-1.5">
          <Text className="text-white/60 font-medium">Créneau horaire *</Text>
          <Picker
            {...register("slot")}
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            <Picker.Item label="Choisir un créneau" value="" />
            {DEFAULT_SLOTS.map((s) => (
              <Picker.Item label={`${s}`} value={s} />
            ))}
          </Picker>
          {errors.slot && (
            <Text className="text-red-400 text-[10px]">{errors.slot.message}</Text>
          )}
        </View>
      </View>

      {/* Type de rendez-vous */}
      <View className="flex flex-col gap-1.5">
        <Text className="text-white/60 font-medium">
          Type de consultation *
        </Text>
        <Picker
          {...register("type")}
          className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          <Picker.Item label="Consultation en clinique" value="consultation" />
          <Picker.Item label="Téléconsultation en ligne" value="teleconsultation" />
          <Picker.Item label="Urgence médicale" value="emergency" />
          <Picker.Item label="Rendez-vous de suivi" value="follow-up" />
        </Picker>
        {errors.type && (
          <Text className="text-red-400 text-[10px]">{errors.type.message}</Text>
        )}
      </View>

      {/* Notes / Symptômes */}
      <View className="flex flex-col gap-1.5">
        <Text className="text-white/60 font-medium">
          Symptômes ou notes de consultation
        </Text>
        <TextInput
         
          {...register("notes")}
          placeholder="Décrivez brièvement les motifs de votre rendez-vous..."
          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white"
         multiline textAlignVertical="top"/>
      </View>

      {/* Rappel */}
      <View className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
        <Text className="text-white/80 font-medium">
          <Text>Activer le rappel automatique (SMS/Push)</Text></Text>
        <Pressable
         
          {...register("reminder")}
          className="w-4 h-4 rounded border-white/10"
         accessibilityRole="checkbox" accessibilityState={{ checked: false }}/>
      </View>

      <Pressable
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-700 disabled:opacity-50"
      >
        {isLoading ? "Réservation..." : submitLabel}
      </Pressable>
    </View>
  );
}
