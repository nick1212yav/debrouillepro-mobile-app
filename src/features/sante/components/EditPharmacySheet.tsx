import { UIService } from "@/core/sdk/ui/UIService";
import { View } from "react-native";

// src/features/sante/components/EditPharmacySheet.tsx
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

interface EditPharmacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pharmacy: any;
  onSuccess?: () => void;
}

export function EditPharmacySheet({
  open,
  onOpenChange,
  pharmacy,
  onSuccess,
}: EditPharmacySheetProps) {
  const updatePharmacy = useMutation(api.health.updatePharmacy);
  if (!pharmacy) return null;

  const handleSubmit = async (data: PharmacyFormValues) => {
    try {
      await updatePharmacy({
        id: pharmacy._id,
        ...data,
        services:
          data.services
            ?.split(",")
            .map((s: string) => s.trim())
            .filter(Boolean) || [],
      });
      UIService.openToast("Pharmacie mise à jour", "success");
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
          <SheetTitle className="text-white">Modifier la pharmacie</SheetTitle>
          <SheetDescription className="text-white/40">
            Mettez à jour les informations
          </SheetDescription>
        </SheetHeader>
        <View className="mt-6">
          <PharmacyForm
            defaultValues={{
              name: pharmacy.name,
              address: pharmacy.address,
              city: pharmacy.city,
              country: pharmacy.country,
              phone: pharmacy.phone,
              email: pharmacy.email || "",
              hours: pharmacy.hours || "Lun-Ven 08:00 - 20:00",
              open: pharmacy.open !== undefined ? pharmacy.open : true,
              services: pharmacy.services?.join(", ") || "",
              delivery: pharmacy.delivery || false,
              deliveryRadius: pharmacy.deliveryRadius || 5,
              deliveryFee: pharmacy.deliveryFee || 0,
              onlineOrders:
                pharmacy.onlineOrders !== undefined
                  ? pharmacy.onlineOrders
                  : true,
              acceptsInsurance: pharmacy.acceptsInsurance || false,
            }}
            onSubmit={handleSubmit}
            submitLabel="Mettre à jour"
          />
        </View>
      </SheetContent>
    </Sheet>
  );
}
