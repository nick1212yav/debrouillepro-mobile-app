import { View } from "react-native";

// src/features/sante/components/EditClinicSheet.tsx
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

interface EditClinicSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinic: any;
  onSuccess?: () => void;
}

export function EditClinicSheet({
  open,
  onOpenChange,
  clinic,
  onSuccess,
}: EditClinicSheetProps) {
  const updateClinic = useMutation(api.health.updateClinic);

  if (!clinic) return null;

  const handleSubmit = async (data: ClinicFormValues) => {
    try {
      await updateClinic({
        id: clinic._id,
        ...data,
        specialties:
          data.specialties
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
      });
      toast.success("Clinique mise à jour !");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour";
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
          <SheetTitle className="text-white">Modifier la clinique</SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations de la clinique
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <ClinicForm
            defaultValues={{
              name: clinic.name,
              address: clinic.address,
              city: clinic.city,
              country: clinic.country,
              phone: clinic.phone,
              email: clinic.email || "",
              hours: clinic.hours || "Lun-Ven 08:00 - 19:00",
              open: clinic.open !== undefined ? clinic.open : true,
              specialties: clinic.specialties?.join(", ") || "",
              description: clinic.description || "",
              emergency: clinic.emergency || false,
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
