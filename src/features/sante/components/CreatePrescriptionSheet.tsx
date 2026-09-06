import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/CreatePrescriptionSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PrescriptionForm } from "../forms/PrescriptionForm";
import type { PrescriptionFormValues } from "../forms/PrescriptionForm";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CreatePrescriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePrescriptionSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreatePrescriptionSheetProps) {
  const createPrescription = useMutation(api.health.addPrescription);

  const patients = useQuery(api.health.listProfessionals, {}); // ⚠️ à remplacer par une vraie requête patients
  const doctors = useQuery(api.health.listProfessionals, {});

  const handleSubmit = async (data: PrescriptionFormValues) => {
    try {
      await createPrescription({
        patientId: data.patientId as any,
        doctorId: data.doctorId as any,
        date: data.date,
        validUntil: data.validUntil,
        medications: data.medications,
        notes: data.notes,
        status: data.status,
        refills: data.refills,
      });
      UIService.openToast("Ordonnance créée avec succès !", "success");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création";
      UIService.openToast(message, "error");
    }
  };

  const patientOptions =
    patients?.map((p: any) => ({ id: p._id, name: p.name })) || [];
  const doctorOptions =
    doctors?.map((d: any) => ({ id: d._id, name: d.name })) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full max-w-md overflow-y-auto"
        style={{ backgroundColor: "#0d0d20", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <SheetHeader>
          <SheetTitle className="text-white">Créer une ordonnance</SheetTitle>
          <SheetDescription className="text-white/40">
            Prescrivez des médicaments à un patient
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <PrescriptionForm
            onSubmit={handleSubmit}
            submitLabel="Créer l'ordonnance"
            patients={patientOptions}
            doctors={doctorOptions}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
