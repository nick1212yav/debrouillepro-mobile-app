import { View } from "react-native";

// src/features/transport/create/CreateAmbulanceForm.tsx
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react-native";
import {
  ambulanceFormSchema,
  type AmbulanceFormValues,
} from "../validators/ambulance.validator";

interface CreateAmbulanceFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateAmbulanceForm({
  onSubmit,
  isLoading = false,
}: CreateAmbulanceFormProps) {
  const form = useForm<AmbulanceFormValues>({
    resolver: zodResolver(ambulanceFormSchema),
    defaultValues: {
      hospitalName: "",
      phone: "",
      vehicleModel: "",
      licensePlate: "",
      operatingZone: "",
      hasParamedics: true,
      equipmentList: "",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: AmbulanceFormValues) => {
      // ✅ Construction du payload compatible avec createTransportRoute
      const payload = {
        // Champs communs
        vehicleType: "ambulance" as const,
        currency: "FCFA",
        status: "active",
        // Champs pour le transport
        driverName: values.hospitalName,
        phone: values.phone,
        city: values.operatingZone,
        vehicleModel: values.vehicleModel,
        vehiclePlate: values.licensePlate,
        pricePerKm: 0,
        // Description enrichie
        description: [
          `🏥 Structure: ${values.hospitalName}`,
          `🩺 Matériel: ${values.equipmentList}`,
          values.hasParamedics ? "👨‍⚕️ Personnel médicalisé à bord" : "",
          `📍 Zone: ${values.operatingZone}`,
          `🚑 Plaque: ${values.licensePlate}`,
        ]
          .filter(Boolean)
          .join("\n"),
        // Équipements
        amenities: values.equipmentList
          ? values.equipmentList.split(",").map((item) => item.trim())
          : ["Équipement médical complet"],
        // Options
        insuranceIncluded: true,
        luggageAllowed: false,
        petsAllowed: false,
        accessibility: true,
      };

      await onSubmit(payload);
    },
    [onSubmit],
  );

  return (
    <Form {...form}>
      <View className="space-y-4"><FormField control={form.control} name="hospitalName" render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nom de la structure hospitalière ou du service d'assistance *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: CHU de Kinshasa, Clinique Ngaliema"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de téléphone d'urgence direct *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: +243 890 112 112"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><View className="gap-4"><FormField control={form.control} name="vehicleModel" render={({ field }) => (
              <FormItem>
                <FormLabel>Modèle du véhicule d'urgence *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Toyota HiAce Ambulance"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /><FormField control={form.control} name="licensePlate" render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de plaque *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 5678AB02"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View><FormField control={form.control} name="operatingZone" render={({ field }) => (
            <FormItem>
              <FormLabel>
                Zone de couverture et d'intervention d'urgence *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Province de Kinshasa, Inter-urbain"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} /><FormField control={form.control} name="equipmentList" render={({ field }) => (
            <FormItem>
              <FormLabel>Liste du matériel médical à bord *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Défibrillateur, Oxygène, Civière de traumatologie"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="hasParamedics" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
              <View className="space-y-0.5">
                <FormLabel className="text-white/90">
                  Médecins / Secouristes qualifiés d'urgence à bord *
                </FormLabel>
                <FormDescription className="text-white/40 text-xs">
                  Garantit la présence constante de personnel médicalisé
                  certifié
                </FormDescription>
              </View>
              <FormControl>
                <Switch
                  
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-red-600"
                />
              </FormControl>
            </FormItem>
          )} /><Button  className="w-full h-12 rounded-xl bg-red-600 text-white font-bold text-base transition-all active:scale-95" disabled={isLoading}>{isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "🚑 Enregistrer le service d'Ambulance"
          )}</Button></View>
    </Form>
  );
}
