import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/CreateMedicalRecordSheet.tsx
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
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface CreateMedicalRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateMedicalRecordSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateMedicalRecordSheetProps) {
  const { user } = useFirebaseAuth();
  const createRecord = useMutation(api.health.addMedicalRecord);

  // Utiliser listProfessionals pour les médecins
  const doctors = useQuery(api.health.listProfessionals, {});
  // Pour les patients, on utilise la liste des utilisateurs (à adapter)
  const patients = useQuery(api.health.listProfessionals, {}); // ⚠️ à remplacer par une vraie requête patients

  const handleSubmit = async (data: MedicalRecordFormValues) => {
    try {
      await createRecord({
        patientId: data.patientId as any,
        doctorId: data.doctorId ? (data.doctorId as any) : undefined,
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
        // attachments non géré pour l'instant
      });
      UIService.openToast("Enregistrement médical créé !", "success");
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
          <SheetTitle className="text-white">
            Créer un enregistrement médical
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Ajoutez une consultation, analyse ou autre événement médical
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <MedicalRecordForm
            defaultValues={{
              patientId: user?.uid || "",
              doctorId: "",
              type: "visit",
              title: "",
              date: new Date().toISOString().split("T")[0],
              summary: "",
              details: "",
              tags: "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Créer l'enregistrement"
            patients={patientOptions}
            doctors={doctorOptions}
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
