import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/CreatePharmacySheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PharmacyForm, type PharmacyFormValues } from "../forms/PharmacyForm";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CreatePharmacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePharmacySheet({
  open,
  onOpenChange,
  onSuccess,
}: CreatePharmacySheetProps) {
  const createPharmacy = useMutation(api.health.createPharmacy);
  const handleSubmit = async (data: PharmacyFormValues) => {
    try {
      await createPharmacy({
        ...data,
        services:
          data.services
            ?.split(",")
            .map((s: string) => s.trim())
            .filter(Boolean) || [],
        images: [],
        products: [],
      });
      UIService.openToast("Pharmacie créée", "success");
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      UIService.openToast("Erreur", "error");
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-white">Créer une pharmacie</SheetTitle>
          <SheetDescription className="text-white/40">
            Ajoutez une nouvelle pharmacie
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <PharmacyForm
            onSubmit={handleSubmit}
            submitLabel="Créer la pharmacie"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
