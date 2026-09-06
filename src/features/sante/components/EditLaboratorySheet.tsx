import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/EditLaboratorySheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { LaboratoryForm } from "../forms/LaboratoryForm";
import type { LaboratoryFormValues } from "../forms/LaboratoryForm";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface EditLaboratorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratory: any;
  onSuccess?: () => void;
}

export function EditLaboratorySheet({
  open,
  onOpenChange,
  laboratory,
  onSuccess,
}: EditLaboratorySheetProps) {
  const updateLab = useMutation(api.health.updateLaboratory);

  if (!laboratory) return null;

  const handleSubmit = async (data: LaboratoryFormValues) => {
    try {
      await updateLab({
        id: laboratory._id,
        ...data,
        testsList:
          data.testsList
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
      });
      UIService.openToast("Laboratoire mis à jour !", "success");
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full max-w-md overflow-y-auto"
        style={{ backgroundColor: "#0d0d20", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <SheetHeader>
          <SheetTitle className="text-white">
            Modifier le laboratoire
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations du laboratoire
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <LaboratoryForm
            defaultValues={{
              name: laboratory.name,
              address: laboratory.address,
              city: laboratory.city,
              country: laboratory.country,
              phone: laboratory.phone,
              email: laboratory.email || "",
              hours: laboratory.hours || "Lun-Ven 07:00 - 18:00",
              open: laboratory.open !== undefined ? laboratory.open : true,
              tests: laboratory.tests || 0,
              equipment: laboratory.equipment || 0,
              testsList: laboratory.testsList?.join(", ") || "",
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
