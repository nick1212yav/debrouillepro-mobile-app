import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/CreateLaboratorySheet.tsx
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

interface CreateLaboratorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateLaboratorySheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateLaboratorySheetProps) {
  const createLab = useMutation(api.health.createLaboratory);

  const handleSubmit = async (data: LaboratoryFormValues) => {
    try {
      await createLab({
        ...data,
        testsList:
          data.testsList
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        images: [],
      });
      UIService.openToast("Laboratoire créé avec succès !", "success");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création";
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
          <SheetTitle className="text-white">Créer un laboratoire</SheetTitle>
          <SheetDescription className="text-white/40">
            Ajoutez un nouveau laboratoire à la plateforme
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <LaboratoryForm
            onSubmit={handleSubmit}
            submitLabel="Créer le laboratoire"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
