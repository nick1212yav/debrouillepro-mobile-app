import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/CreateVaccinationSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { VaccinationForm } from "../forms/VaccinationForm";
import type { VaccinationFormValues } from "../forms/VaccinationForm";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CreateVaccinationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateVaccinationSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateVaccinationSheetProps) {
  const createVaccination = useMutation(api.health.addVaccination);
  const patients = useQuery(api.health.listPatients, {}); // ✅ bonne requête

  const handleSubmit = async (data: VaccinationFormValues) => {
    try {
      await createVaccination({
        patientId: data.patientId as any,
        name: data.name,
        date: data.date,
        nextDose: data.nextDose,
        status: data.status,
        administeredBy: data.administeredBy,
        location: data.location,
        batchNumber: data.batchNumber,
        sideEffects: data.sideEffects,
      });
      UIService.openToast("Vaccination enregistrée !", "success");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement";
      UIService.openToast(message, "error");
    }
  };

  const patientOptions =
    patients?.map((p: any) => ({ id: p._id, name: p.name })) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full max-w-md overflow-y-auto"
        style={{ backgroundColor: "#0d0d20", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <SheetHeader>
          <SheetTitle className="text-white">
            Enregistrer une vaccination
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Ajoutez un vaccin administré à un patient
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <VaccinationForm
            onSubmit={handleSubmit}
            submitLabel="Enregistrer"
            patients={patientOptions}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
