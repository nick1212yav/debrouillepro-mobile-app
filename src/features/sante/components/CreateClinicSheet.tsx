import { View } from "react-native";

// src/features/sante/components/CreateClinicSheet.tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ClinicForm } from "../forms/ClinicForm";
import type { ClinicFormValues } from "../forms/ClinicForm";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface CreateClinicSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateClinicSheet({
  open,
  onOpenChange,
  onSuccess,
}: CreateClinicSheetProps) {
  const createClinic = useMutation(api.health.createClinic);

  const handleSubmit = async (data: ClinicFormValues) => {
    try {
      await createClinic({
        ...data,
        specialties:
          data.specialties
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        images: [],
      });
      toast.success("Clinique créée avec succès !");
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
          <SheetTitle className="text-white">Créer une clinique</SheetTitle>
          <SheetDescription className="text-white/40">
            Ajoutez une nouvelle clinique à la plateforme
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <ClinicForm onSubmit={handleSubmit} submitLabel="Créer la clinique" />
        </View>
      </SheetContent>
    </Sheet>
  );
}
