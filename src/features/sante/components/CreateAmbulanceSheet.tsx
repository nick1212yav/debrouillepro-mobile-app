import { View } from "react-native";

// src/features/sante/components/CreateAmbulanceSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AmbulanceForm } from "../forms/AmbulanceForm";
import type { AmbulanceFormValues } from "../forms/AmbulanceForm";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface CreateAmbulanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAmbulanceSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateAmbulanceSheetProps) {
  // ⚠️ La mutation sera implémentée dans le backend Convex
  const createAmbulance = useMutation(api.health.createAmbulance);

  const handleSubmit = async (data: AmbulanceFormValues) => {
    try {
      await createAmbulance({
        ...data,
        // Champs supplémentaires
      });
      toast.success("Service d'ambulance créé avec succès !");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création";
      toast.error(message);
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
            Créer un service d'ambulance
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Ajoutez un nouveau service d'ambulance
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <AmbulanceForm
            onSubmit={handleSubmit}
            submitLabel="Créer le service"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
