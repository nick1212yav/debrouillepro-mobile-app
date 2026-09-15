import { View } from "react-native";

// src/features/transport/create/CreateMotoForm.tsx
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react-native";
import {
  motoFormSchema,
  type MotoFormValues,
} from "../validators/moto.validator";

interface CreateMotoFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateMotoForm({
  onSubmit,
  isLoading = false,
}: CreateMotoFormProps) {
  const form = useForm<MotoFormValues>({
    resolver: zodResolver(motoFormSchema),
    defaultValues: {
      driverName: "",
      phone: "",
      motoModel: "",
      licensePlate: "",
      pricePerKm: 250,
      currency: "FCFA",
      helmetProvided: true,
      insuranceActive: true,
      operatingZone: "",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: MotoFormValues) => {
      // ✅ Construction du payload compatible avec createTransportRoute
      const payload = {
        // Champs communs
        vehicleType: "moto" as const,
        currency: values.currency || "FCFA",
        status: "active",
        // Champs pour le motard
        driverName: values.driverName,
        phone: values.phone,
        vehicleModel: values.motoModel,
        city: values.operatingZone,
        pricePerSeat: values.pricePerKm, // Réutilisation pour le prix par km
        // Options
        insuranceIncluded: values.insuranceActive,
        // ✅ Description enrichie (plus de meta)
        description: [
          `🏍️ Moto: ${values.motoModel}`,
          `📍 Plaque: ${values.licensePlate}`,
          `📍 Zone: ${values.operatingZone}`,
          `💲 Prix km: ${values.pricePerKm} ${values.currency}`,
          values.helmetProvided ? "🪖 Casque fourni" : "❌ Casque non fourni",
          values.insuranceActive
            ? "✅ Assurance active"
            : "❌ Assurance inactive",
        ]
          .filter(Boolean)
          .join("\n"),
        // Équipements (amenities)
        amenities: [
          values.helmetProvided ? "Casque fourni" : "",
          "Entretien régulier",
        ].filter(Boolean),
        // Sécurité et accessibilité
        luggageAllowed: false,
        petsAllowed: false,
        accessibility: false,
      };

      await onSubmit(payload);
    },
    [onSubmit],
  );

  return (
    <Form {...form}>
      <View className="space-y-4"><FormField control={form.control} name="driverName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet du motard *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Alain Mutombo"
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
          )} /><View className="gap-4"><FormField control={form.control} name="motoModel" render={({ field }) => (
              <FormItem>
                <FormLabel>Modèle de la moto *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: TVS Star HLX, Haojin"
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
                    placeholder="Ex: M-1234BC01"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} /></View><View className="gap-4"><FormField control={form.control} name="pricePerKm" render={({ field }) => (
              <FormItem>
                <FormLabel>Prix estimé par km *</FormLabel>
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
            )} /></View><FormField control={form.control} name="operatingZone" render={({ field }) => (
            <FormItem>
              <FormLabel>Zone d'activité habituelle *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Kintambo, Gombe, Limete"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />{}<FormField control={form.control} name="helmetProvided" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
              <View className="space-y-0.5">
                <FormLabel className="text-white/90">
                  Casque fourni au client *
                </FormLabel>
                <FormDescription className="text-white/40 text-xs">
                  Obligatoire selon la charte DébrouillePro
                </FormDescription>
              </View>
              <FormControl>
                <Switch
                  
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-violet-600"
                />
              </FormControl>
            </FormItem>
          )} />{}<FormField control={form.control} name="insuranceActive" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
              <View className="space-y-0.5">
                <FormLabel className="text-white/90">
                  Assurance responsabilité civile active *
                </FormLabel>
                <FormDescription className="text-white/40 text-xs">
                  Protection obligatoire pour le conducteur et le passager
                </FormDescription>
              </View>
              <FormControl>
                <Switch
                  
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-violet-600"
                />
              </FormControl>
            </FormItem>
          )} /><Button  className="w-full h-12 rounded-xl bg-violet-600 text-white font-bold text-base transition-all active:scale-95" disabled={isLoading}>{isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "🏍️ Enregistrer le service de Moto-Taxi"
          )}</Button></View>
    </Form>
  );
}
