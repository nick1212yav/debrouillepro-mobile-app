import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/EditVaccinationSheet.tsx
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

interface EditVaccinationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaccination: any;
  onSuccess?: () => void;
}

export function EditVaccinationSheet({
  open,
  onOpenChange,
  vaccination,
  onSuccess,
}: EditVaccinationSheetProps) {
  const updateVaccination = useMutation(api.health.updateVaccination);
  const patients = useQuery(api.health.listPatients, {}); // ✅ bonne requête

  if (!vaccination) return null;

  const handleSubmit = async (data: VaccinationFormValues) => {
    try {
      await updateVaccination({
        id: vaccination._id,
        name: data.name,
        date: data.date,
        nextDose: data.nextDose,
        status: data.status,
        administeredBy: data.administeredBy,
        location: data.location,
        batchNumber: data.batchNumber,
        sideEffects: data.sideEffects,
      });
      UIService.openToast("Vaccination mise à jour !", "success");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour";
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
            Modifier la vaccination
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations de la vaccination
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <VaccinationForm
            defaultValues={{
              patientId: vaccination.patientId,
              name: vaccination.name,
              date: vaccination.date?.split("T")[0] || "",
              nextDose: vaccination.nextDose?.split("T")[0] || "",
              status: vaccination.status || "completed",
              administeredBy: vaccination.administeredBy || "",
              location: vaccination.location || "",
              batchNumber: vaccination.batchNumber || "",
              sideEffects: vaccination.sideEffects || "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
            patients={patientOptions}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
