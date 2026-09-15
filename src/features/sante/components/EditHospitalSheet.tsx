import { View } from "react-native";

// src/features/sante/components/EditHospitalSheet.tsx
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
import { toast } from "sonner";

interface EditHospitalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospital: any;
  onSuccess?: () => void;
}

export function EditHospitalSheet({
  open,
  onOpenChange,
  hospital,
  onSuccess,
}: EditHospitalSheetProps) {
  const updateHospital = useMutation(api.health.updateHospital);

  if (!hospital) return null;

  const handleSubmit = async (data: HospitalFormValues) => {
    try {
      await updateHospital({
        id: hospital._id,
        ...data,
        services:
          data.services
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
      });
      toast.success("Hôpital mis à jour !");
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
          <SheetTitle className="text-white">Modifier l'hôpital</SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations de l'hôpital
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <HospitalForm
            defaultValues={{
              name: hospital.name,
              type: hospital.type,
              address: hospital.address,
              city: hospital.city,
              country: hospital.country,
              phone: hospital.phone,
              email: hospital.email || "",
              website: hospital.website || "",
              hours: hospital.hours || "24h/24",
              open: hospital.open !== undefined ? hospital.open : true,
              beds: hospital.beds || 0,
              doctors: hospital.doctors || 0,
              specialties: hospital.specialties || 0,
              description: hospital.description || "",
              services: hospital.services?.join(", ") || "",
              priceRange: hospital.priceRange || "$$",
              emergency:
                hospital.emergency !== undefined ? hospital.emergency : true,
              parking: hospital.parking !== undefined ? hospital.parking : true,
              pharmacy: hospital.pharmacy || false,
              cafeteria: hospital.cafeteria || false,
              wifi: hospital.wifi !== undefined ? hospital.wifi : true,
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
