import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/CreateDoctorSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { DoctorForm } from "../forms/DoctorForm";
import type { DoctorFormValues } from "../forms/DoctorForm"; // ✅ correction
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface CreateDoctorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateDoctorSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateDoctorSheetProps) {
  const { user } = useFirebaseAuth();
  const createDoctor = useMutation(api.health.createProfessional);

  const handleSubmit = async (data: DoctorFormValues) => {
    try {
      await createDoctor({
        ...data,
        userId: user?.uid || "anonymous",
        available: true,
        languages:
          data.languages
            ?.split(",")
            .map((s: string) => s.trim())
            .filter(Boolean) || [],
        insurances:
          data.insurances
            ?.split(",")
            .map((s: string) => s.trim())
            .filter(Boolean) || [],
        specialities: [data.specialty],
        education: [],
        certificates: [],
        awards: [],
        badges: [],
        images: [],
      });
      UIService.openToast("Médecin créé", "success");
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      UIService.openToast("Erreur", "error");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full max-w-md overflow-y-auto"
        style={{ backgroundColor: "#0d0d20" }}
      >
        <SheetHeader>
          <SheetTitle className="text-white">Créer un médecin</SheetTitle>
          <SheetDescription className="text-white/40">
            Ajoutez un nouveau médecin à la plateforme
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <DoctorForm onSubmit={handleSubmit} submitLabel="Créer le médecin" />
        </View>
      </SheetContent>
    </Sheet>
  );
}
