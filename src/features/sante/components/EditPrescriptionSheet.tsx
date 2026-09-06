import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/EditPrescriptionSheet.tsx
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

interface EditPrescriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: any;
  onSuccess?: () => void;
}

export function EditPrescriptionSheet({
  open,
  onOpenChange,
  prescription,
  onSuccess,
}: EditPrescriptionSheetProps) {
  const updatePrescription = useMutation(api.health.updatePrescription);

  const patients = useQuery(api.health.listProfessionals, {}); // ⚠️ à remplacer par une vraie requête patients
  const doctors = useQuery(api.health.listProfessionals, {});

  if (!prescription) return null;

  const handleSubmit = async (data: PrescriptionFormValues) => {
    try {
      // updatePrescription n'accepte que status, refills, notes, medications
      await updatePrescription({
        id: prescription._id,
        status: data.status,
        refills: data.refills,
        notes: data.notes,
        medications: data.medications,
      });
      UIService.openToast("Ordonnance mise à jour !", "success");
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
  const doctorOptions =
    doctors?.map((d: any) => ({ id: d._id, name: d.name })) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full max-w-md overflow-y-auto"
        style={{ backgroundColor: "#0d0d20", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <SheetHeader>
          <SheetTitle className="text-white">Modifier l'ordonnance</SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations de l'ordonnance
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <PrescriptionForm
            defaultValues={{
              patientId: prescription.patientId,
              doctorId: prescription.doctorId,
              date: prescription.date?.split("T")[0] || "",
              validUntil: prescription.validUntil?.split("T")[0] || "",
              medications: prescription.medications || [
                { name: "", dosage: "", frequency: "", duration: "" },
              ],
              notes: prescription.notes || "",
              status: prescription.status || "active",
              refills: prescription.refills || 0,
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
            patients={patientOptions}
            doctors={doctorOptions}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
