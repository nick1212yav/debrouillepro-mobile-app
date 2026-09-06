import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/EditDoctorSheet.tsx
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
import type { Doctor } from "../types/doctor.types";

interface EditDoctorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: Doctor | null;
  onSuccess?: () => void;
}

export function EditDoctorSheet({
  open,
  onOpenChange,
  doctor,
  onSuccess,
}: EditDoctorSheetProps) {
  const updateDoctor = useMutation(api.health.updateProfessional);
  if (!doctor) return null;

  const handleSubmit = async (data: DoctorFormValues) => {
    try {
      await updateDoctor({
        id: doctor._id,
        ...data,
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
      });
      UIService.openToast("Médecin mis à jour", "success");
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
          <SheetTitle className="text-white">Modifier le médecin</SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations du médecin
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <DoctorForm
            defaultValues={{
              name: doctor.name,
              specialty: doctor.specialty,
              fees: doctor.fees,
              currency: doctor.currency,
              phone: doctor.phone || "",
              email: doctor.email || "",
              address: doctor.address || "",
              city: doctor.city || "",
              country: doctor.country || "",
              bio: doctor.bio || "",
              experience: doctor.experience || 0,
              languages: doctor.languages?.join(", ") || "",
              insurances: doctor.insurances?.join(", ") || "",
              schedule: doctor.schedule || "Lun-Ven 09:00 - 18:00",
              online: doctor.online || false,
              verified: doctor.verified || false,
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
