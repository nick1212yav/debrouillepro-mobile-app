import { View, Text } from "react-native";

// src/features/transport/create/CreateCarRentalForm.tsx
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
import { Textarea } from "@/components/ui/textarea";
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
  rentalFormSchema,
  type RentalFormValues,
} from "../validators/rental.validator";

interface CreateCarRentalFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

const FUEL_POLICIES: Record<RentalFormValues["fuelPolicy"], string> = {
  full_to_full: "Plein à Plein (Restituer réservoir plein)",
  same_to_same: "Niveau identique (Restituer au même niveau)",
  included: "Carburant inclus",
};

export function CreateCarRentalForm({
  onSubmit,
  isLoading = false,
}: CreateCarRentalFormProps) {
  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: {
      agencyName: "",
      phone: "",
      vehicleModel: "",
      vehiclePlate: "",
      dailyPrice: 25000,
      currency: "FCFA",
      hasDriver: false,
      fuelPolicy: "full_to_full",
      securityDeposit: 50000,
      description: "",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: RentalFormValues) => {
      // ✅ Construction du payload compatible avec createTransportRoute
      const payload = {
        // Champs communs
        vehicleType: "voiture" as const,
        currency: values.currency || "FCFA",
        status: "active",
        // Champs pour le véhicule
        driverName: values.agencyName,
        phone: values.phone,
        vehicleModel: values.vehicleModel,
        pricePerSeat: values.dailyPrice, // Réutilisation du champ pour le prix journalier
        seats: 5, // Valeur par défaut pour une voiture
        // ✅ Description enrichie avec toutes les infos (pas de meta)
        description: [
          values.description,
          `🚗 Modèle: ${values.vehicleModel}`,
          `📍 Plaque: ${values.vehiclePlate}`,
          `💰 Prix journalier: ${values.dailyPrice?.toLocaleString()} ${values.currency}`,
          `🔒 Caution: ${values.securityDeposit?.toLocaleString()} ${values.currency}`,
          `⛽ Politique carburant: ${FUEL_POLICIES[values.fuelPolicy] || values.fuelPolicy}`,
          values.hasDriver
            ? "👨‍✈️ Chauffeur professionnel inclus"
            : "🚗 Location sans chauffeur",
        ]
          .filter(Boolean)
          .join("\n"),
        // Équipements (amenities)
        amenities: [
          "Climatisation",
          ...(values.hasDriver ? ["Chauffeur inclus"] : []),
        ],
        // Options
        insuranceIncluded: true,
        luggageAllowed: true,
        petsAllowed: true,
        accessibility: false,
      };

      await onSubmit(payload);
    },
    [onSubmit],
  );

  return (
    <Form {...form}>
      <View className="space-y-4">
        <FormField
          control={form.control}
          name="agencyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nom de l'agence / du propriétaire *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Congo Car Rental"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Téléphone de contact *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: +243 890 000 000"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-4">
          <FormField
            control={form.control}
            name="vehicleModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Marque et modèle du véhicule *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Toyota Prado, 2015"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehiclePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Plaque d'immatriculation *</Text></FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 1234AB01"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <View className="gap-2">
          <FormField
            control={form.control}
            name="dailyPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Prix journalier *</Text></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-white"
                    {...field}
                    onChange={(text) =>
                      field.onChange(parseFloat(text) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="securityDeposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Caution de garantie *</Text></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    className="bg-white/5 border-white/10 text-white"
                    {...field}
                    onChange={(text) =>
                      field.onChange(parseFloat(text) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Devise</Text></FormLabel>
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
                    <SelectItem value="FCFA"><Text>FCFA</Text></SelectItem>
                    <SelectItem value="USD"><Text>USD</Text></SelectItem>
                    <SelectItem value="EUR"><Text>EUR</Text></SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </View>

        <FormField
          control={form.control}
          name="fuelPolicy"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Politique de carburant *</Text></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  {Object.entries(FUEL_POLICIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Option avec chauffeur */}
        <FormField
          control={form.control}
          name="hasDriver"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
              <View className="space-y-0.5">
                <FormLabel className="text-white/90">
                  <Text>Location avec chauffeur professionnel *</Text></FormLabel>
                <FormDescription className="text-white/40 text-xs">
                  <Text>Chauffeur attitré inclus dans le tarif d'exploitation</Text></FormDescription>
              </View>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-blue-600"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Text>Description détaillée du véhicule (Options, climatisation, boîte de vitesse, etc.)</Text></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Boîte automatique, climatisation tri-zone, 7 places assises, toit ouvrant..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Text>Enregistrement...</Text></>
          ) : (
            "🚗 Enregistrer le véhicule de location"
          )}
        </Button>
      </View>
    </Form>
  );
}
