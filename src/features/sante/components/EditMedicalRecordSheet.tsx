import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/EditMedicalRecordSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { MedicalRecordForm } from "../forms/MedicalRecordForm";
import type { MedicalRecordFormValues } from "../forms/MedicalRecordForm";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface EditMedicalRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  onSuccess?: () => void;
}

export function EditMedicalRecordSheet({
  open,
  onOpenChange,
  record,
  onSuccess,
}: EditMedicalRecordSheetProps) {
  const updateRecord = useMutation(api.health.updateMedicalRecord);

  const doctors = useQuery(api.health.listProfessionals, {});
  const patients = useQuery(api.health.listProfessionals, {}); // ⚠️ à remplacer par une vraie requête patients

  if (!record) return null;

  const handleSubmit = async (data: MedicalRecordFormValues) => {
    try {
      // updateMedicalRecord n'accepte pas patientId ni doctorId (seulement doctorId via le patch)
      await updateRecord({
        id: record._id,
        type: data.type,
        title: data.title,
        date: data.date,
        summary: data.summary,
        details: data.details,
        tags:
          data.tags
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        // doctorId: data.doctorId, // si le schéma le permet
      });
      UIService.openToast("Enregistrement mis à jour !", "success");
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
          <SheetTitle className="text-white">
            Modifier l'enregistrement
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations de l'enregistrement
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <MedicalRecordForm
            defaultValues={{
              patientId: record.patientId,
              doctorId: record.doctorId || "",
              type: record.type || "visit",
              title: record.title,
              date: record.date?.split("T")[0] || "",
              summary: record.summary,
              details: record.details || "",
              tags: record.tags?.join(", ") || "",
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
