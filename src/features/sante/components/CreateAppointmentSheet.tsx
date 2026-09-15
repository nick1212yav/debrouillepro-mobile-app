import { View } from "react-native";

// src/features/sante/components/CreateAppointmentSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AppointmentForm,
  type AppointmentFormValues,
} from "../forms/AppointmentForm";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface CreateAppointmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDoctorId?: string;
  onSuccess?: () => void;
}

export function CreateAppointmentSheet({
  open,
  onOpenChange,
  defaultDoctorId,
  onSuccess,
}: CreateAppointmentSheetProps) {
  const { user } = useFirebaseAuth();
  const createAppointment = useMutation(api.health.bookAppointment);
  const doctors = useQuery(api.health.listProfessionals, {});
  const patients = useQuery(api.health.listPatients, {});

  const handleSubmit = async (data: AppointmentFormValues) => {
    try {
      await createAppointment({
        professionalId: data.doctorId as any,
        slot: data.slot,
        type:
          data.type === "emergency" || data.type === "follow-up"
            ? "consultation"
            : data.type,
        date: data.date,
        notes: data.notes,
      });
      toast.success("Rendez-vous créé !");
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const doctorOptions =
    doctors?.map((d: any) => ({ id: d._id, name: d.name })) || [];
  const patientOptions =
    patients?.map((p: any) => ({ id: p._id, name: p.name })) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-white">Créer un rendez-vous</SheetTitle>
          <SheetDescription className="text-white/40">
            Planifiez un rendez-vous médical
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <AppointmentForm
            defaultValues={{
              doctorId: defaultDoctorId || "",
              patientId: user?.uid || "",
              date: new Date().toISOString().split("T")[0],
              slot: "",
              type: "consultation",
              durationMinutes: 30,
              notes: "",
              reminder: true,
            }}
            onSubmit={handleSubmit}
            submitLabel="Créer le rendez-vous"
            doctors={doctorOptions}
            patients={patientOptions}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
