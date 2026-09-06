import { View, Text } from "react-native";

// src/features/transport/create/CreateCourierForm.tsx
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
  courierFormSchema,
  type CourierFormValues,
} from "../validators/courier.validator";

interface CreateCourierFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  isLoading?: boolean;
}

// Mapping des modes de transport vers vehicleType
const TRANSPORT_MODE_MAP: Record<string, string> = {
  moto: "moto",
  velo: "voiture",
  voiture: "voiture",
  marche: "voiture",
};

export function CreateCourierForm({
  onSubmit,
  isLoading = false,
}: CreateCourierFormProps) {
  const form = useForm<CourierFormValues>({
    resolver: zodResolver(courierFormSchema),
    defaultValues: {
      courierName: "",
      phone: "",
      transportMode: "moto",
      licenseNumber: "",
      maxWeightKg: 15,
      basePrice: 1500,
      pricePerKm: 300,
      currency: "FCFA",
      operatingZone: "",
    },
  });

  // Transformation des données pour le backend Convex
  const handleSubmit = useCallback(
    async (values: CourierFormValues) => {
      const vehicleType = TRANSPORT_MODE_MAP[values.transportMode] || "voiture";

      const payload = {
        vehicleType: vehicleType as any,
        currency: values.currency || "FCFA",
        status: "active",
        driverName: values.courierName,
        phone: values.phone,
        city: values.operatingZone,
        pricePerKm: values.pricePerKm,
        pricePerSeat: values.basePrice,
        description: [
          `📦 Livreur: ${values.courierName}`,
          `🛵 Mode: ${values.transportMode}`,
          values.licenseNumber ? `📄 Permis: ${values.licenseNumber}` : "",
          `⚖️ Capacité max: ${values.maxWeightKg} kg`,
          `📍 Zone: ${values.operatingZone}`,
          `💰 Prise en charge: ${values.basePrice?.toLocaleString()} ${values.currency}`,
          `💲 Tarif km: ${values.pricePerKm} ${values.currency}`,
        ]
          .filter(Boolean)
          .join("\n"),
        amenities: [
          values.transportMode === "moto" ? "Casque fourni" : "",
          "Sac de livraison",
        ].filter(Boolean),
        insuranceIncluded: true,
        luggageAllowed: true,
        petsAllowed: false,
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
          name="courierName"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Nom complet du livreur *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Marc Ndongala"
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
              <FormLabel><Text>Téléphone direct *</Text></FormLabel>
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
            name="transportMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Moyen de locomotion *</Text></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                    <SelectItem value="moto"><Text>Moto</Text></SelectItem>
                    <SelectItem value="velo"><Text>Vélo</Text></SelectItem>
                    <SelectItem value="voiture"><Text>Voiture</Text></SelectItem>
                    <SelectItem value="marche"><Text>À pied</Text></SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxWeightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Capacité max (kg) *</Text></FormLabel>
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
        </View>

        <FormField
          control={form.control}
          name="licenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Numéro de permis (Optionnel)</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: PER-98765-A"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <View className="gap-2">
          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Prise en charge *</Text></FormLabel>
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
            name="pricePerKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel><Text>Tarif par km *</Text></FormLabel>
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
          name="operatingZone"
          render={({ field }) => (
            <FormItem>
              <FormLabel><Text>Zone de livraison habituelle *</Text></FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Limete, Gombe, Bandalungwa"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="w-full h-12 rounded-xl bg-violet-600 text-white font-bold text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Text>Enregistrement...</Text></>
          ) : (
            "📦 Enregistrer mon profil de Coursier"
          )}
        </Button>
      </View>
    </Form>
  );
}
