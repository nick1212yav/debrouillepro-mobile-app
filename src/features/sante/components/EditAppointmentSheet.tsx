import { View } from "react-native";

// src/features/sante/components/EditAppointmentSheet.tsx
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

interface EditAppointmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: any;
  onSuccess?: () => void;
}

export function EditAppointmentSheet({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: EditAppointmentSheetProps) {
  const updateAppointment = useMutation(api.health.updateAppointment);
  const doctors = useQuery(api.health.listProfessionals, {});
  const patients = useQuery(api.health.listPatients, {});

  if (!appointment) return null;

  const handleSubmit = async (data: AppointmentFormValues) => {
    try {
      await updateAppointment({
        id: appointment._id,
        slot: data.slot,
        date: data.date,
        notes: data.notes,
        // ❌ reminder n'est pas accepté par la mutation
        // On ne l'envoie pas
      });
      toast.success("Rendez-vous mis à jour !");
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
      <SheetContent
        className="w-full max-w-md overflow-y-auto"
        style={{ backgroundColor: "#0d0d20" }}
      >
        <SheetHeader>
          <SheetTitle className="text-white">
            Modifier le rendez-vous
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations du rendez-vous
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <AppointmentForm
            defaultValues={{
              doctorId: appointment.doctorId,
              patientId: appointment.patientId,
              date: appointment.date?.split("T")[0] || "",
              slot: appointment.slot || "",
              type: appointment.type || "consultation",
              durationMinutes: appointment.durationMinutes || 30,
              notes: appointment.notes || "",
              reminder:
                appointment.reminder !== undefined
                  ? appointment.reminder
                  : true,
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
            doctors={doctorOptions}
            patients={patientOptions}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
