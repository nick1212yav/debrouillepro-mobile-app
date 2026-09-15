import { View } from "react-native";

// src/features/sante/components/EditAmbulanceSheet.tsx
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

interface EditAmbulanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ambulance: any;
  onSuccess?: () => void;
}

export function EditAmbulanceSheet({
  open,
  onOpenChange,
  ambulance,
  onSuccess,
}: EditAmbulanceSheetProps) {
  const updateAmbulance = useMutation(api.health.updateAmbulance);

  if (!ambulance) return null;

  const handleSubmit = async (data: AmbulanceFormValues) => {
    try {
      await updateAmbulance({
        id: ambulance._id,
        ...data,
      });
      toast.success("Service d'ambulance mis à jour !");
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
          <SheetTitle className="text-white">
            Modifier le service d'ambulance
          </SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations du service
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <AmbulanceForm
            defaultValues={{
              name: ambulance.name,
              address: ambulance.address,
              city: ambulance.city,
              country: ambulance.country,
              phone: ambulance.phone,
              emergencyPhone: ambulance.emergencyPhone || "15",
              hours: ambulance.hours || "24h/24",
              available:
                ambulance.available !== undefined ? ambulance.available : true,
              vehicles: ambulance.vehicles || 1,
              paramedics: ambulance.paramedics || 0,
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
