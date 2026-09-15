import { View } from "react-native";

// src/features/transport/create/CreateTaxiForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react-native";
import {
  taxiFormSchema,
  type TaxiFormValues,
} from "../validators/taxi.validator";

interface CreateTaxiFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateTaxiForm({
  onSubmit,
  isLoading = false,
}: CreateTaxiFormProps) {
  const form = useForm<TaxiFormValues>({
    resolver: zodResolver(taxiFormSchema),
    defaultValues: {
      driverName: "",
      phone: "",
      vehicleModel: "",
      vehiclePlate: "",
      basePrice: 1000,
      pricePerKm: 500,
      currency: "FCFA",
      city: "Kinshasa",
      availability: "Lun-Sam 07:00 - 20:00",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: TaxiFormValues) => {
      // Construction du payload pour createTransportRoute
      const payload = {
        // Champs communs
        vehicleType: "taxi" as const,
        currency: values.currency || "FCFA",
        status: "active",
        // Champs pour le chauffeur
        driverName: values.driverName,
        phone: values.phone,
        vehicleModel: values.vehicleModel,
        city: values.city,
        // ✅ On intègre toutes les infos dans description
        description: [
          `🚕 Véhicule: ${values.vehicleModel}`,
          `📍 Plaque: ${values.vehiclePlate}`,
          `💰 Prise en charge: ${values.basePrice?.toLocaleString()} ${values.currency}`,
          `📅 Horaires: ${values.availability}`,
          `💲 Tarif km: ${values.pricePerKm} ${values.currency}`,
        ]
          .filter(Boolean)
          .join("\n"),
        // Équipements (amenities)
        amenities: ["Climatisation", "Siège bébé sur demande"],
        // Options
        insuranceIncluded: true,
        luggageAllowed: true,
        petsAllowed: true,
        accessibility: false,
      };

      // ✅ Plus de champ `meta` – tout est dans description ou champs existants
      await onSubmit(payload);
    },
    [onSubmit],
  );

  return (
    <Form {...form}>
      <View className="space-y-4"><FormField control={form.control} name="driverName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet du chauffeur *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Jean Mukendi"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone direct *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: +243 890 000 000"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><View className="gap-4"><FormField control={form.control} name="vehicleModel" render={({ field }) => (
              <FormItem>
                <FormLabel>Modèle du véhicule *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Toyota Corolla, 2011"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="vehiclePlate" render={({ field }) => (
              <FormItem>
                <FormLabel>Plaque d'immatriculation *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 5678AB01"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View><View className="gap-2"><FormField control={form.control} name="basePrice" render={({ field }) => (
              <FormItem>
                <FormLabel>Prise en charge *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-white"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="pricePerKm" render={({ field }) => (
              <FormItem>
                <FormLabel>Tarif par km *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-white"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem>
                <FormLabel>Devise</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Devise" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectItem value="FCFA">FCFA</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} /></View><View className="gap-4"><FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>Ville de service *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Kinshasa"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="availability" render={({ field }) => (
              <FormItem>
                <FormLabel>Horaires de service</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Lun-Sam 07:00 - 20:00"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View><Button  className="w-full h-12 rounded-xl bg-violet-600 text-white font-bold text-base transition-all active:scale-95" disabled={isLoading}>{isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "🚕 Enregistrer le profil de Taxi"
          )}</Button></View>
    </Form>
  );
}
