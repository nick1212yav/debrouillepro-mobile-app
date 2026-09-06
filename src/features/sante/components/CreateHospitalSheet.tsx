import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/CreateHospitalSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { HospitalForm } from "../forms/HospitalForm";
import type { HospitalFormValues } from "../forms/HospitalForm";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CreateHospitalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateHospitalSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateHospitalSheetProps) {
  const createHospital = useMutation(api.health.createHospital);

  const handleSubmit = async (data: HospitalFormValues) => {
    try {
      await createHospital({
        ...data,
        ambulance: false, // champ requis dans le schéma
        services:
          data.services
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        images: [],
      });
      UIService.openToast("Hôpital créé avec succès !", "success");
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
          <SheetTitle className="text-white">Créer un hôpital</SheetTitle>
          <SheetDescription className="text-white/40">
            Ajoutez un nouvel hôpital à la plateforme
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <HospitalForm onSubmit={handleSubmit} submitLabel="Créer l'hôpital" />
        </View>
      </SheetContent>
    </Sheet>
  );
}
